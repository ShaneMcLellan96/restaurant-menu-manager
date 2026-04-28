'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

export default function NewMenuPage() {
  const router = useRouter();
  const [name, setName]         = useState('');
  const [isActive, setIsActive] = useState(true);
  const [hours, setHours]       = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  function toggleDay(day) {
    setHours((prev) =>
      prev.find((h) => h.day === day)
        ? prev.filter((h) => h.day !== day)
        : [...prev, { day, open: '09:00', close: '22:00' }]
    );
  }

  function updateHour(day, field, value) {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, [field]: value } : h))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          isActive,
          availableHours: hours,
          restaurantId: process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to create menu');
      }
      const menu = await res.json();
      router.push(`/menus/${menu._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Menu</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Menu Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dinner, Brunch, Seasonal"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-brand-600"
          />
          <span className="text-sm text-gray-700">Active</span>
        </label>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Available Hours (optional)</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {DAYS.map(({ key, label }) => {
              const active = hours.some((h) => h.day === key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    active
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {hours.map((h) => (
            <div key={h.day} className="flex items-center gap-3 mb-2 text-sm">
              <span className="w-8 font-medium capitalize text-gray-600">{h.day}</span>
              <input
                type="time"
                value={h.open}
                onChange={(e) => updateHour(h.day, 'open', e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <span className="text-gray-400">to</span>
              <input
                type="time"
                value={h.close}
                onChange={(e) => updateHour(h.day, 'close', e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Menu'}
          </button>
        </div>
      </form>
    </div>
  );
}
