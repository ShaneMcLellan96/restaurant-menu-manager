import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MenuItem from '@/lib/models/MenuItem';
import { ingestMenuItems } from '@/lib/rag';

// Bulk re-index all items for a restaurant (or a specific menu)
export async function POST(request) {
  await connectDB();
  const { restaurantId, menuId } = await request.json();

  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
  }

  const filter = { restaurantId, ...(menuId && { menuId }) };
  const items = await MenuItem.find(filter).lean();

  if (!items.length) {
    return NextResponse.json({ ingested: 0, message: 'No items found' });
  }

  await ingestMenuItems(items);

  return NextResponse.json({
    ingested: items.length,
    message: `Successfully ingested ${items.length} items into Pinecone`,
  });
}
