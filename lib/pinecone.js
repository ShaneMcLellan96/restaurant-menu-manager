import { Pinecone } from '@pinecone-database/pinecone';

let _client = null;

function getClient() {
  if (!_client) {
    _client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return _client;
}

export function getIndex() {
  return getClient().index(process.env.PINECONE_INDEX);
}

export async function upsertVectors(vectors) {
  const index = getIndex();
  // Pinecone upsert in batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    await index.upsert(vectors.slice(i, i + 100));
  }
}

export async function queryVectors({ vector, topK = 5, filter = {} }) {
  const index = getIndex();
  const result = await index.query({
    vector,
    topK,
    filter,
    includeMetadata: true,
  });
  return result.matches;
}

export async function deleteVectors(ids) {
  const index = getIndex();
  await index.deleteMany(ids);
}
