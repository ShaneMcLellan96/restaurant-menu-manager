import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Menu from '@/lib/models/Menu';
import MenuItem from '@/lib/models/MenuItem';
import Category from '@/lib/models/Category';
import KPICard from '@/components/KPICard';
import MenuCard from '@/components/MenuCard';

export const dynamic = 'force-dynamic';

async function getStats() {
  await connectDB();
  const [totalMenus, totalItems, availableItems, categories] = await Promise.all([
    Menu.countDocuments(),
    MenuItem.countDocuments(),
    MenuItem.countDocuments({ isAvailable: true }),
    Category.countDocuments(),
  ]);
  const featuredItems = await MenuItem.countDocuments({ isFeatured: true });
  const recentMenus   = await Menu.find().sort({ createdAt: -1 }).limit(6).lean();

  return { totalMenus, totalItems, availableItems, categories, featuredItems, recentMenus };
}

export default async function DashboardPage() {
  const { totalMenus, totalItems, availableItems, categories, featuredItems, recentMenus } =
    await getStats();

  const unavailableItems = totalItems - availableItems;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your restaurant menus</p>
        </div>
        <Link
          href="/menus/new"
          className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          + New Menu
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KPICard title="Total Menus"       value={totalMenus}      color="brand" />
        <KPICard title="Menu Items"        value={totalItems}      color="blue"  />
        <KPICard title="Available Items"   value={availableItems}  color="brand" subtitle={`${unavailableItems} unavailable`} />
        <KPICard title="Featured Items"    value={featuredItems}   color="amber" />
      </div>

      {/* Recent menus */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Menus</h2>
          <Link href="/menus" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>

        {recentMenus.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-400 mb-4">No menus yet.</p>
            <Link
              href="/menus/new"
              className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
            >
              Create your first menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMenus.map((menu) => (
              <MenuCard key={menu._id} menu={menu} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
