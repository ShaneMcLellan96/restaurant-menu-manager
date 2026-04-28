'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ItemCard({ item, onAvailabilityToggle }) {
  const [loading, setLoading] = useState(false);

  async function toggleAvailability() {
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${item._id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (res.ok) {
        const updated = await res.json();
        onAvailabilityToggle?.(updated);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">{item.name}</span>
          {item.isFeatured && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Featured
            </span>
          )}
          {item.dietaryTags?.map((tag) => (
            <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {item.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
        )}

        <div className="mt-2 flex items-center gap-4 text-sm">
          <span className="font-semibold text-gray-900">${item.price.toFixed(2)}</span>
          {item.calories != null && (
            <span className="text-gray-400">{item.calories} cal</span>
          )}
          {item.allergens?.length > 0 && (
            <span className="text-gray-400 text-xs">
              Allergens: {item.allergens.join(', ')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleAvailability}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            item.isAvailable ? 'bg-brand-500' : 'bg-gray-200'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              item.isAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <Link
          href={`/items/${item._id}/edit`}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
