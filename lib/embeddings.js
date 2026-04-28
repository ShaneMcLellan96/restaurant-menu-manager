const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';

export async function embedTexts(texts) {
  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: texts, model: 'voyage-3' }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage AI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

export async function embedSingle(text) {
  const [embedding] = await embedTexts([text]);
  return embedding;
}
