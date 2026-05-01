import Anthropic from '@anthropic-ai/sdk';
import { embedSingle, embedTexts } from './embeddings.js';
import { upsertVectors, queryVectors, deleteVectors } from './pinecone.js';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import Menu from './models/Menu.js';
import MenuItem from './models/MenuItem.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Serialize a menu item into a descriptive text chunk for embedding
function serializeItem(item) {
  const parts = [
    `Item: ${item.name}`,
    item.description ? `Description: ${item.description}` : null,
    `Price: $${item.price.toFixed(2)}`,
    item.calories != null ? `Calories: ${item.calories}` : null,
    item.dietaryTags?.length ? `Dietary tags: ${item.dietaryTags.join(', ')}` : null,
    item.allergens?.length ? `Allergens: ${item.allergens.join(', ')}` : null,
    item.ingredients?.length ? `Ingredients: ${item.ingredients.join(', ')}` : null,
    `Available: ${item.isAvailable ? 'yes' : 'no'}`,
    item.isFeatured ? 'Featured item.' : null,
  ];
  return parts.filter(Boolean).join('. ');
}

export async function ingestMenuItem(item) {
  const text = serializeItem(item);
  const [embedding] = await embedTexts([text]);

  const restaurantId = item.restaurantId.toString();

  await upsertVectors([
    {
      id: item._id.toString(),
      values: embedding,
      metadata: buildMetadata(item, restaurantId),
    },
  ]);
}

function buildMetadata(item, restaurantId) {
  const md = {
    restaurantId,
    menuId:      item.menuId.toString(),
    categoryId:  item.categoryId.toString(),
    itemId:      item._id.toString(),
    name:        item.name,
    price:       item.price,
    isAvailable: !!item.isAvailable,
    isFeatured:  !!item.isFeatured,
    dietaryTags: item.dietaryTags ?? [],
    allergens:   item.allergens ?? [],
    ingredients: item.ingredients ?? [],
  };
  if (item.description) md.description = item.description;
  if (item.calories != null) md.calories = item.calories;
  return md;
}

export async function ingestMenuItems(items) {
  if (!items.length) return;
  const texts = items.map(serializeItem);
  const embeddings = await embedTexts(texts);

  const vectors = items.map((item, i) => ({
    id: item._id.toString(),
    values: embeddings[i],
    metadata: buildMetadata(item, item.restaurantId.toString()),
  }));

  await upsertVectors(vectors);
}

export async function deleteMenuItemVector(itemId) {
  await deleteVectors([itemId.toString()]);
}

// Returns a ReadableStream that streams the Claude response
export async function queryMenuStream({ restaurantId, question }) {
  const questionEmbedding = await embedSingle(question);

  const [matches] = await Promise.all([
    queryVectors({
      vector: questionEmbedding,
      topK: 100,
      filter: { restaurantId: { $eq: restaurantId } },
    }),
    connectDB(),
  ]);

  // Build a map of menuId -> menu name so the LLM knows which menu each item belongs to,
  // and provide ground-truth item counts per menu so it doesn't have to count from context.
  const [menus, itemCounts] = await Promise.all([
    Menu.find({ restaurantId }, { _id: 1, name: 1, isActive: 1 }).lean(),
    MenuItem.aggregate([
      {
        $match: {
          restaurantId:
            typeof restaurantId === 'string'
              ? new mongoose.Types.ObjectId(restaurantId)
              : restaurantId,
        },
      },
      { $group: { _id: '$menuId', count: { $sum: 1 } } },
    ]),
  ]);
  const countByMenuId = new Map(itemCounts.map((c) => [c._id.toString(), c.count]));
  const menuNameById = new Map(menus.map((m) => [m._id.toString(), m.name]));
  const menuList = menus
    .map((m) => {
      const count = countByMenuId.get(m._id.toString()) ?? 0;
      const tag = m.isActive ? '' : ' (inactive)';
      return `- ${m.name}${tag}: ${count} item${count === 1 ? '' : 's'}`;
    })
    .join('\n') || '(no menus)';

  const context = matches
    .map((m, i) => {
      const menuName = menuNameById.get(m.metadata?.menuId) ?? 'Unknown menu';
      const fields = Object.entries(m.metadata)
        .filter(([k]) => !['restaurantId','menuId','categoryId','itemId'].includes(k))
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('; ');
      return `[${i + 1}] menu: ${menuName}; ${fields}`;
    })
    .join('\n');

  const systemPrompt = `You are a helpful assistant for a restaurant. Answer questions about the menu based only on the context provided.

This restaurant has the following menus (with authoritative item counts):
${menuList}

Each item in the context is tagged with the menu it belongs to (e.g. "menu: Dinner Menu").

Rules:
- When the user asks about a specific menu by name (e.g. "what is on the seasonal menu"), only list items whose menu field matches that menu name.
- When the user asks for "featured" items, only include items where isFeatured is true.
- When the user asks for counts ("how many items..."), use the authoritative counts above. Do not count by hand from the context list.
- When the user asks for the full menu or every item on a specific menu, list every item from the context whose menu matches, and ensure the number you list equals the authoritative count above.
- Be concise and friendly. If the answer is not in the context, say you don't have that information.`;

  const userMessage = `Menu context:\n${context}\n\nQuestion: ${question}`;

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return stream;
}
