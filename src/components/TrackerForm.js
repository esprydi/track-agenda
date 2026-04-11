"use client";

import { useState } from "react";
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
  isCustomTimer,
  toggleCustomTimer,
  countdownHours,
  setCountdownHours,
  countdownMinutes,
  setCountdownMinutes,
  countdownSeconds,
  setCountdownSeconds,
  countdownTargetSeconds,
}) {
  const customSeconds = countdownHours * 3600 + countdownMinutes * 60 + countdownSeconds;
  const displaySeconds = isCustomTimer && !isRunning ? customSeconds : seconds;

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 text-center">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-transparent border-b border-slate-600 mb-4 text-center text-xl focus:outline-none focus:border-blue-500"
        placeholder="Masukkan Kegiatanmu..."
      />

      <div className="mb-4 text-left">
        <div className="mb-2">
          <label className="block text-sm text-slate-300">Kategori</label>
        </div>
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
            Timer Mode:
          <button
            type="button"
            onClick={() => toggleCustomTimer(false)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              !isCustomTimer
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => toggleCustomTimer(true)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              isCustomTimer
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="mb-8 text-left">
        {isCustomTimer && !isRunning ? (
          <>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm text-slate-300">Durasi Custom</label>
              {countdownTargetSeconds > 0 && (
                <span className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300">
                  Hitung mundur aktif
                </span>
              )}
            </div>
            <div className="mx-auto flex items-center justify-center gap-2 rounded-3xl border border-slate-600 bg-slate-900 px-4 py-4 text-white">
              <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-slate-950 text-4xl">
                <input
                  id="countdownHours"
                  type="number"
                  min={0}
                  value={countdownHours}
                  onChange={(e) => setCountdownHours(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-transparent text-center text-3xl font-mono outline-none text-white placeholder:text-slate-500"
                  placeholder="00"
                />
              </div>
              <span className="text-4xl text-slate-400">:</span>
              <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-slate-950 text-4xl">
                <input
                  id="countdownMinutes"
                  type="number"
                  min={0}
                  max={59}
                  value={countdownMinutes}
                  onChange={(e) => setCountdownMinutes(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full bg-transparent text-center text-3xl font-mono outline-none text-white placeholder:text-slate-500"
                  placeholder="00"
                />
              </div>
              <span className="text-4xl text-slate-400">:</span>
              <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-slate-950 text-4xl">
                <input
                  id="countdownSeconds"
                  type="number"
                  min={0}
                  max={59}
                  value={countdownSeconds}
                  onChange={(e) => setCountdownSeconds(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full bg-transparent text-center text-3xl font-mono outline-none text-white placeholder:text-slate-500"
                  placeholder="00"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">Edit langsung di tampilan waktu sebelum tekan PLAY.</p>
          </>
        ) : (
          <div className="text-6xl font-mono font-bold">{formatTime(displaySeconds)}</div>
        )}
      </div>

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
