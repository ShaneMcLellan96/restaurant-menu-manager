import Link from 'next/link';

export default function MenuCard({ menu }) {
  return (
    <Link
      href={`/menus/${menu._id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-brand-300 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{menu.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {menu.availableHours?.length
              ? `${menu.availableHours.length} time slot(s)`
              : 'Always available'}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            menu.isActive
              ? 'bg-brand-100 text-brand-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {menu.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Created {new Date(menu.createdAt).toLocaleDateString()}
      </p>
    </Link>
  );
}
