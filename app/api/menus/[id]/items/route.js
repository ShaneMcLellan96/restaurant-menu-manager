import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Menu from '@/lib/models/Menu';
import MenuItem from '@/lib/models/MenuItem';
import Category from '@/lib/models/Category';
import { ingestMenuItem } from '@/lib/rag';

export async function GET(request, { params }) {
  const { id: menuId } = await params;
  await connectDB();

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const filter = { menuId, ...(categoryId && { categoryId }) };

  const items = await MenuItem.find(filter).sort({ categoryId: 1, name: 1 }).lean();
  return NextResponse.json(items);
}

export async function POST(request, { params }) {
  const { id: menuId } = await params;
  await connectDB();

  const body = await request.json();

  const menu = await Menu.findById(menuId).lean();
  if (!menu) {
    return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
  }

  let categoryId = body.categoryId;
  const categoryName = body.categoryName?.trim();

  if (!categoryId && categoryName) {
    const existing = await Category.findOne({
      menuId,
      restaurantId: menu.restaurantId,
      name: categoryName,
    }).lean();

    if (existing) {
      categoryId = existing._id;
    } else {
      const created = await Category.create({
        menuId,
        restaurantId: menu.restaurantId,
        name: categoryName,
      });
      categoryId = created._id;
    }
  }

  if (!categoryId) {
    return NextResponse.json(
      { error: 'categoryId or categoryName is required' },
      { status: 400 }
    );
  }

  const { categoryName: _ignored, ...rest } = body;
  const item = await MenuItem.create({
    ...rest,
    menuId,
    restaurantId: menu.restaurantId,
    categoryId,
  });

  // Verify the category belongs to this menu
  const category = await Category.findOne({
    _id: item.categoryId,
    menuId,
    restaurantId: item.restaurantId,
  });
  if (!category) {
    await MenuItem.findByIdAndDelete(item._id);
    return NextResponse.json({ error: 'Invalid categoryId for this menu' }, { status: 400 });
  }

  // Index into Pinecone asynchronously (don't block the response)
  ingestMenuItem(item).catch((e) => console.error('Pinecone ingest error:', e));

  return NextResponse.json(item, { status: 201 });
}
