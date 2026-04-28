'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ALLERGEN_OPTIONS = ['gluten','dairy','eggs','nuts','peanuts','soy','fish','shellfish','sesame'];
const DIETARY_OPTIONS  = ['vegan','vegetarian','gluten-free','dairy-free','nut-free','halal','kosher','low-carb'];

function TagCheckboxGroup({ label, options, selected, onChange }) {
  function toggle(opt) {
    onChange(
      selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]
    );
  }
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              selected.includes(opt)
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function IngredientsInput({ ingredients, onChange }) {
  const [input, setInput] = useState('');

  function add() {
    const val = input.trim();
    if (val && !ingredients.includes(val)) {
      onChange([...ingredients, val]);
      setInput('');
    }
  }

  function remove(i) {
    onChange(ingredients.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Type and press Enter"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ingredients.map((ing, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-sm"
          >
            {ing}
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-500 font-bold leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ItemEditorForm({ menuId, categories = [], initialData = null }) {
  const router = useRouter();
  const isEdit = Boolean(initialData?._id);

  const [form, setForm] = useState({
    name:         initialData?.name         ?? '',
    description:  initialData?.description  ?? '',
    price:        initialData?.price        ?? '',
    calories:     initialData?.calories     ?? '',
    categoryId:   initialData?.categoryId   ?? (categories[0]?._id ?? ''),
    categoryName: '',
    allergens:    initialData?.allergens    ?? [],
    dietaryTags:  initialData?.dietaryTags  ?? [],
    ingredients:  initialData?.ingredients  ?? [],
    isAvailable:  initialData?.isAvailable  ?? true,
    isFeatured:   initialData?.isFeatured   ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      ...form,
      price:    parseFloat(form.price),
      calories: form.calories !== '' ? parseInt(form.calories, 10) : undefined,
    };

    if (payload.categoryName?.trim()) {
      payload.categoryName = payload.categoryName.trim();
      delete payload.categoryId;
    } else {
      delete payload.categoryName;
    }

    try {
      const url = isEdit ? `/api/items/${initialData._id}` : `/api/menus/${menuId}/items`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save item');
      }

      const saved = await res.json();
      router.push(`/menus/${saved.menuId}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Calories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
          <input
            type="number"
            min="0"
            value={form.calories}
            onChange={(e) => set('calories', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>

          {categories.length > 0 && (
            <select
              required={!form.categoryName.trim()}
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          )}

          <input
            required={categories.length === 0}
            value={form.categoryName}
            onChange={(e) => set('categoryName', e.target.value)}
            placeholder={categories.length === 0 ? 'Type a category name' : 'Or type a new category name'}
            className={`mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 ${categories.length === 0 ? '' : ''}`}
            list="category-suggestions"
          />
          {categories.length > 0 && (
            <datalist id="category-suggestions">
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name} />
              ))}
            </datalist>
          )}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6 self-end pb-2">
          {[['isAvailable', 'Available'], ['isFeatured', 'Featured']].map(([field, lbl]) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[field]}
                onChange={(e) => set(field, e.target.checked)}
                className="w-4 h-4 rounded accent-brand-600"
              />
              <span className="text-sm text-gray-700">{lbl}</span>
            </label>
          ))}
        </div>
      </div>

      <TagCheckboxGroup
        label="Allergens"
        options={ALLERGEN_OPTIONS}
        selected={form.allergens}
        onChange={(v) => set('allergens', v)}
      />

      <TagCheckboxGroup
        label="Dietary Tags"
        options={DIETARY_OPTIONS}
        selected={form.dietaryTags}
        onChange={(v) => set('dietaryTags', v)}
      />

      <IngredientsInput
        ingredients={form.ingredients}
        onChange={(v) => set('ingredients', v)}
      />

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
          {saving ? 'Saving…' : isEdit ? 'Update Item' : 'Create Item'}
        </button>
      </div>
    </form>
  );
}
