import Anthropic from '@anthropic-ai/sdk';
import { embedSingle, embedTexts } from './embeddings.js';
import { upsertVectors, queryVectors, deleteVectors } from './pinecone.js';

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

  await upsertVectors([
    {
      id: item._id.toString(),
      values: embedding,
      metadata: {
        restaurantId: item.restaurantId.toString(),
        menuId:       item.menuId.toString(),
        categoryId:   item.categoryId.toString(),
        itemId:       item._id.toString(),
        name:         item.name,
        price:        item.price,
        isAvailable:  item.isAvailable,
        dietaryTags:  item.dietaryTags ?? [],
        allergens:    item.allergens ?? [],
        ingredients:  item.ingredients ?? [],
      },
    },
  ]);
}

export async function ingestMenuItems(items) {
  if (!items.length) return;
  const texts = items.map(serializeItem);
  const embeddings = await embedTexts(texts);

  const vectors = items.map((item, i) => ({
    id: item._id.toString(),
    values: embeddings[i],
    metadata: {
      restaurantId: item.restaurantId.toString(),
      menuId:       item.menuId.toString(),
      categoryId:   item.categoryId.toString(),
      itemId:       item._id.toString(),
      name:         item.name,
      price:        item.price,
      isAvailable:  item.isAvailable,
      dietaryTags:  item.dietaryTags ?? [],
      allergens:    item.allergens ?? [],
      ingredients:  item.ingredients ?? [],
    },
  }));

  await upsertVectors(vectors);
}

export async function deleteMenuItemVector(itemId) {
  await deleteVectors([itemId.toString()]);
}

// Returns a ReadableStream that streams the Claude response
export async function queryMenuStream({ restaurantId, question }) {
  const questionEmbedding = await embedSingle(question);

  const matches = await queryVectors({
    vector: questionEmbedding,
    topK: 5,
    filter: { restaurantId: { $eq: restaurantId } },
  });

  const context = matches
    .map((m, i) => `[${i + 1}] ${Object.entries(m.metadata)
      .filter(([k]) => !['restaurantId','menuId','categoryId','itemId'].includes(k))
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('; ')}`)
    .join('\n');

  const systemPrompt = `You are a helpful assistant for a restaurant. Answer questions about the menu based only on the context provided. Be concise and friendly. If the answer is not in the context, say you don't have that information.`;

  const userMessage = `Menu context:\n${context}\n\nQuestion: ${question}`;

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return stream;
}
