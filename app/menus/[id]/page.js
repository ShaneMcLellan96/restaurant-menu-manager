import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Menu from '@/lib/models/Menu';
import Category from '@/lib/models/Category';
import MenuItem from '@/lib/models/MenuItem';
import CategorySection from '@/components/CategorySection';
import DeleteMenuButton from '@/components/DeleteMenuButton';

export const dynamic = 'force-dynamic';

export default async function MenuDetailPage({ params }) {
  const { id } = await params;
  await connectDB();

  const [menu, categories] = await Promise.all([
    Menu.findById(id).lean(),
    Category.find({ menuId: id }).sort({ sortOrder: 1, name: 1 }).lean(),
  ]);

  if (!menu) notFound();

  const items = await MenuItem.find({ menuId: id }).sort({ name: 1 }).lean();

  // Group items by category
  const itemsByCategory = {};
  for (const item of items) {
    const key = item.categoryId.toString();
    (itemsByCategory[key] ??= []).push(item);
  }

  // Serialise ObjectIds for client components
  const safeCategories = categories.map((c) => ({
    _id: c._id.toString(),
    menuId: c.menuId?.toString(),
    restaurantId: c.restaurantId?.toString(),
    name: c.name,
    description: c.description,
    sortOrder: c.sortOrder,
    isVisible: c.isVisible,
    createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
    updatedAt: c.updatedAt?.toISOString?.() ?? c.updatedAt,
  }));
  const safeItemsByCategory = Object.fromEntries(
    Object.entries(itemsByCategory).map(([k, v]) => [
      k,
      v.map((i) => ({
        _id: i._id.toString(),
        restaurantId: i.restaurantId?.toString(),
        menuId: i.menuId.toString(),
        categoryId: i.categoryId.toString(),
        name: i.name,
        description: i.description,
        price: i.price,
        allergens: i.allergens,
        dietaryTags: i.dietaryTags,
        ingredients: i.ingredients,
        isAvailable: i.isAvailable,
        isFeatured: i.isFeatured,
        calories: i.calories,
        createdAt: i.createdAt?.toISOString(),
        updatedAt: i.updatedAt?.toISOString(),
      })),
    ])
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/menus" className="text-sm text-gray-400 hover:text-gray-600">
              ← Menus
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{menu.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                menu.isActive ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {menu.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-sm text-gray-500">
              {items.length} item{items.length !== 1 ? 's' : ''} across {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/menus/${id}/items/new`}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            + Add Item
          </Link>
          <DeleteMenuButton menuId={id} menuName={menu.name} />
        </div>
      </div>

      {/* Categories + Items */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 mb-2">No categories yet.</p>
          <p className="text-sm text-gray-400">
            Add items to automatically create categories, or manage categories via the API.
          </p>
        </div>
      ) : (
        safeCategories.map((cat) => (
          <CategorySection
            key={cat._id}
            category={cat}
            initialItems={safeItemsByCategory[cat._id] ?? []}
          />
        ))
      )}

      {/* Items not assigned to any listed category */}
      {(() => {
        const categoryIds = new Set(safeCategories.map((c) => c._id));
        const orphans = items
          .filter((i) => !categoryIds.has(i.categoryId.toString()))
          .map((i) => ({
            _id: i._id.toString(),
            restaurantId: i.restaurantId?.toString(),
            menuId: i.menuId.toString(),
            categoryId: i.categoryId.toString(),
            name: i.name,
            description: i.description,
            price: i.price,
            allergens: i.allergens,
            dietaryTags: i.dietaryTags,
            ingredients: i.ingredients,
            isAvailable: i.isAvailable,
            isFeatured: i.isFeatured,
            calories: i.calories,
            createdAt: i.createdAt?.toISOString(),
            updatedAt: i.updatedAt?.toISOString(),
          }));
        if (!orphans.length) return null;
        return (
          <CategorySection
            category={{ _id: '__uncategorised', name: 'Uncategorised' }}
            initialItems={orphans}
          />
        );
      })()}
    </div>
  );
}
