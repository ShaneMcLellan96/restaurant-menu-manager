import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Menu from '@/lib/models/Menu';
import MenuCard from '@/components/MenuCard';

export const dynamic = 'force-dynamic';

export default async function MenusPage() {
  await connectDB();
  const menus = await Menu.find().sort({ createdAt: -1 }).lean();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
          <p className="text-sm text-gray-500 mt-0.5">{menus.length} menu{menus.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/menus/new"
          className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          + New Menu
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
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
          {menus.map((menu) => (
            <MenuCard key={menu._id} menu={menu} />
          ))}
        </div>
      )}
    </div>
  );
}
