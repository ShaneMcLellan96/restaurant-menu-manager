import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MenuItem from '@/lib/models/MenuItem';
import { ingestMenuItem } from '@/lib/rag';

export async function PATCH(request, { params }) {
  const { id } = await params;
  await connectDB();

  const { isAvailable } = await request.json();
  if (typeof isAvailable !== 'boolean') {
    return NextResponse.json({ error: 'isAvailable must be a boolean' }, { status: 400 });
  }

  const item = await MenuItem.findByIdAndUpdate(
    id,
    { isAvailable },
    { new: true }
  );
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Keep Pinecone metadata in sync
  try {
    await ingestMenuItem(item);
  } catch (e) {
    console.error('Pinecone ingest error:', e);
  }

  return NextResponse.json(item);
}
