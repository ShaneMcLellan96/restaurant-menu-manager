import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Menu from '@/lib/models/Menu';
import Category from '@/lib/models/Category';
import ItemEditorForm from '@/components/ItemEditorForm';

export default async function NewItemPage({ params }) {
  const { id: menuId } = await params;
  await connectDB();

  const [menu, categories] = await Promise.all([
    Menu.findById(menuId).lean(),
    Category.find({ menuId }).sort({ sortOrder: 1, name: 1 }).lean(),
  ]);

  if (!menu) notFound();

  const safeCategories = categories.map((c) => ({
    _id:  c._id.toString(),
    name: c.name,
  }));

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-1">
          <a href={`/menus/${menuId}`} className="hover:text-gray-600">← {menu.name}</a>
        </p>
        <h1 className="text-2xl font-bold text-gray-900">New Item</h1>
      </div>
      <ItemEditorForm menuId={menuId} categories={safeCategories} />
    </div>
  );
}
