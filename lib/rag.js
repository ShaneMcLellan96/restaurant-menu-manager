import Anthropic from '@anthropic-ai/sdk';
import { embedSingle, embedTexts } from './embeddings.js';
import { upsertVectors, queryVectors, deleteVectors } from './pinecone.js';
import { connectDB } from './db.js';
import Menu from './models/Menu.js';

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

  // Build a map of menuId -> menu name so the LLM knows which menu each item belongs to
  const menus = await Menu.find({ restaurantId }, { _id: 1, name: 1, isActive: 1 }).lean();
  const menuNameById = new Map(menus.map((m) => [m._id.toString(), m.name]));
  const menuList = menus
    .map((m) => `- ${m.name}${m.isActive ? '' : ' (inactive)'}`)
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

This restaurant has the following menus:
${menuList}

Each item in the context is tagged with the menu it belongs to (e.g. "menu: Dinner Menu"). When the user asks about a specific menu by name (e.g. "what is on the seasonal menu"), only list items whose menu field matches that menu name. When the user asks for "featured" items, only include items where isFeatured is true. When asked for the full menu or all items, list every item in the context grouped by menu. Be concise and friendly. If the answer is not in the context, say you don't have that information.`;

  const userMessage = `Menu context:\n${context}\n\nQuestion: ${question}`;

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return stream;
}
