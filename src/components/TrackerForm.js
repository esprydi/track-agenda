"use client";

import Link from "next/link";

const getCategoryLabel = (category) =>
  category?.name ?? category?.title ?? category?.category ?? category?.label ?? category?.id;

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export default function TrackerForm({
  title,
  setTitle,
  categoryId,
  setCategoryId,
  categories,
  categoriesError,
  isLoadingCategories,
  isRunning,
  onStart,
  onStop,
  seconds,
}) {
  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 text-center">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-transparent border-b border-slate-600 mb-4 text-center text-xl focus:outline-none focus:border-blue-500"
        placeholder="Judul task..."
      />

      <div className="mb-4 text-left">
        <label className="block text-sm text-slate-300 mb-2">Kategori</label>
        {categoriesError ? <p className="text-sm text-red-400">{categoriesError}</p> : null}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={isLoadingCategories || categories.length === 0}
          className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">
            {isLoadingCategories
              ? "Memuat kategori..."
              : categories.length === 0
              ? "Kategori belum tersedia"
              : "Pilih kategori"}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getCategoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      <div className="text-6xl font-mono font-bold mb-8">{formatTime(seconds)}</div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4 justify-center">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-full font-bold transition"
            >
              PLAY
            </button>
          ) : (
            <button
              onClick={onStop}
              className="bg-red-600 hover:bg-red-500 px-8 py-3 rounded-full font-bold transition"
            >
              STOP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
