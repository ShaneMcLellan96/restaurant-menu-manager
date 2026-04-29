'use client';

import { useState } from 'react';
import ItemCard from './ItemCard';

export default function CategorySection({ category, initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [collapsed, setCollapsed] = useState(false);

  function handleAvailabilityToggle(updated) {
    setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
  }

  function handleDelete(deletedId) {
    setItems((prev) => prev.filter((i) => i._id !== deletedId));
  }

  return (
    <section className="mb-8">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <span className="text-lg font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">
          {category.name}
        </span>
        {category.description && (
          <span className="text-sm text-gray-400">— {category.description}</span>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {items.length} item{items.length !== 1 ? 's' : ''} {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-2">No items in this category.</p>
          ) : (
            items.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                onAvailabilityToggle={handleAvailabilityToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}
