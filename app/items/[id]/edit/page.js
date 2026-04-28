import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import MenuItem from '@/lib/models/MenuItem';
import Category from '@/lib/models/Category';
import ItemEditorForm from '@/components/ItemEditorForm';

export default async function EditItemPage({ params }) {
  const { id } = await params;
  await connectDB();

  const item = await MenuItem.findById(id).lean();
  if (!item) notFound();

  const categories = await Category.find({ menuId: item.menuId })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const safeItem = {
    ...item,
    _id:          item._id.toString(),
    menuId:       item.menuId.toString(),
    categoryId:   item.categoryId.toString(),
    restaurantId: item.restaurantId?.toString(),
    createdAt:    item.createdAt?.toISOString(),
    updatedAt:    item.updatedAt?.toISOString(),
  };

  const safeCategories = categories.map((c) => ({
    _id:  c._id.toString(),
    name: c.name,
  }));

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-1">
          <a href={`/menus/${item.menuId}`} className="hover:text-gray-600">← Back to menu</a>
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Edit Item</h1>
      </div>
      <ItemEditorForm
        menuId={safeItem.menuId}
        categories={safeCategories}
        initialData={safeItem}
      />
    </div>
  );
}
