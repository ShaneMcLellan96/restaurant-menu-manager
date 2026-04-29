import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Menu from '@/lib/models/Menu';
import MenuItem from '@/lib/models/MenuItem';
import Category from '@/lib/models/Category';
import { deleteMenuItemVector } from '@/lib/rag';

export async function GET(request, { params }) {
  const { id } = await params;
  await connectDB();
  const menu = await Menu.findById(id).lean();
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(menu);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  await connectDB();
  const body = await request.json();
  const menu = await Menu.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(menu);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await connectDB();

  const menu = await Menu.findById(id);
  if (!menu) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Cascade-delete items (and their Pinecone vectors) and categories
  const items = await MenuItem.find({ menuId: id }, { _id: 1 }).lean();
  await Promise.all(
    items.map((it) =>
      deleteMenuItemVector(it._id).catch((e) =>
        console.error('Pinecone delete error for', it._id.toString(), e)
      )
    )
  );
  await MenuItem.deleteMany({ menuId: id });
  await Category.deleteMany({ menuId: id });
  await Menu.findByIdAndDelete(id);

  return NextResponse.json({ success: true, deletedItems: items.length });
}
