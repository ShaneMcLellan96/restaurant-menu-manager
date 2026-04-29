'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteMenuButton({ menuId, menuName }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${menuName}"? This will also delete all of its categories and items. This cannot be undone.`
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/menus/${menuId}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Failed to delete menu');
      }
      router.push('/menus');
      router.refresh();
    } catch (err) {
      alert(err.message);
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="shrink-0 px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      {busy ? 'Deleting…' : 'Delete Menu'}
    </button>
  );
}
