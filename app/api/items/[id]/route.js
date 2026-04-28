import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MenuItem from '@/lib/models/MenuItem';
import Category from '@/lib/models/Category';
import { ingestMenuItem, deleteMenuItemVector } from '@/lib/rag';

export async function GET(request, { params }) {
  const { id } = await params;
  await connectDB();
  const item = await MenuItem.findById(id).lean();
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  await connectDB();
  const body = await request.json();

  const existingItem = await MenuItem.findById(id).lean();
  if (!existingItem) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let update = { ...body };
  const categoryName = body.categoryName?.trim();

  if (categoryName) {
    const found = await Category.findOne({
      menuId: existingItem.menuId,
      restaurantId: existingItem.restaurantId,
      name: categoryName,
    }).lean();

    if (found) {
      update.categoryId = found._id;
    } else {
      const created = await Category.create({
        menuId: existingItem.menuId,
        restaurantId: existingItem.restaurantId,
        name: categoryName,
      });
      update.categoryId = created._id;
    }
  }

  delete update.categoryName;

  const item = await MenuItem.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const category = await Category.findOne({
    _id: item.categoryId,
    menuId: item.menuId,
    restaurantId: item.restaurantId,
  }).lean();

  if (!category) {
    return NextResponse.json({ error: 'Invalid categoryId for this menu' }, { status: 400 });
  }

  // Re-index updated item
  ingestMenuItem(item).catch((e) => console.error('Pinecone ingest error:', e));

  return NextResponse.json(item);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await connectDB();
  const item = await MenuItem.findByIdAndDelete(id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  deleteMenuItemVector(id).catch((e) => console.error('Pinecone delete error:', e));

  return NextResponse.json({ success: true });
}
