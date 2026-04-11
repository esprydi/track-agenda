"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase.js";

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [colorCode, setColorCode] = useState("#3b82f6");
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,color_code")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      setError(error.message ?? "Gagal memuat kategori.");
    } else {
      setCategories(data || []);
      setError("");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchCategories);
  }, [fetchCategories]);

  const handleAddCategory = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nama kategori tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from("categories").insert([
      {
        name: name.trim(),
        color_code: colorCode || "#3b82f6",
      },
    ]);

    if (error) {
      console.error("Error adding category:", error);
      setError(error.message || "Gagal menambahkan kategori.");
    } else {
      setName("");
      setColorCode("#3b82f6");
      setError("");
      fetchCategories();
    }
    setIsSaving(false);
  };

  const handleDeleteCategory = async (categoryId) => {
    const confirmed = window.confirm("Hapus kategori ini? Tindakan tidak dapat dibatalkan.");
    if (!confirmed) return;

    const { error } = await supabase.from("categories").delete().eq("id", categoryId);
    if (error) {
      console.error("Error deleting category:", error);
      setError(error.message || "Gagal menghapus kategori.");
    } else {
      setError("");
      fetchCategories();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Category</h1>
            <p className="mt-2 text-slate-400">
              Tambahkan atau hapus kategori yang akan dipakai pada time tracker.
            </p>
          </div>
          <Link href="/" className="rounded-full bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Kembali ke Tracker
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Tambah Kategori Baru</h2>
          <form onSubmit={handleAddCategory} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-300">Nama Kategori</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Work, Study, Personal"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">Warna Kategori</span>
              <input
                type="color"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                className="mt-2 h-12 w-full cursor-pointer rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3"
              />
            </label>

            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Menyimpan..." : "Tambah Kategori"}
              </button>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Daftar Kategori</h2>
              <p className="mt-1 text-sm text-slate-400">Kategori ini akan muncul pada form tracker.</p>
            </div>
            <button
              onClick={fetchCategories}
              className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-800"
            >
              Muat ulang
            </button>
          </div>

          {isLoading ? (
            <p className="mt-6 text-slate-400">Memuat kategori...</p>
          ) : categories.length === 0 ? (
            <p className="mt-6 text-slate-400">Belum ada kategori.</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-700"
                      style={{ backgroundColor: category.color_code || "#3b82f6" }}
                    />
                    <div>
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-sm text-slate-500">{category.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
