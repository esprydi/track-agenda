"use client";  // Wajib ada karena kita pakai tombol dan interaksi
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

export default function Home() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [title, setTitle] = useState("Belajar Coding");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const getCategoryLabel = (category) =>
    category.name ?? category.title ?? category.category ?? category.label ?? category.id;

  // Efek untuk menjalankan hitungan detik saat isRunning true
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval); // Bersihkan interval saat komponen unmount atau isRunning berubah
  }, [isRunning]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        setCategoriesError(`Gagal memuat kategori: ${error.message}`);
      } else {
        setCategories(data || []);
      }
      setIsLoadingCategories(false);
    };

    fetchCategories();
  }, []);

  // Fungsi saat klik Play
  const handleStart = () => {
    if (isLoadingCategories) {
      alert("Kategori masih dimuat, tunggu sebentar.");
      return;
    }

    if (categories.length === 0) {
      alert("Kategori belum tersedia. Silakan tambahkan kategori terlebih dahulu.");
      return;
    }

    if (!categoryId) {
      alert("Pilih kategori terlebih dahulu sebelum memulai.");
      return;
    }

    setIsRunning(true);
  };

  // Fungsi saat klik Stop
  const handleStop = async () => {
    setIsRunning(false);
    alert(`Hebat! Kamu sudah fokus selama ${seconds} detik untuk "${title}".`);

    // Simpan data ke Supabase hanya saat completed
    const { data, error } = await supabase.from('agendas').insert([
      {
        title: title,
        actual_duration_sec: seconds,
        status: 'completed',
        category_id: categoryId,
      }
    ]);

    if (error) {
      console.error("Error inserting data (agendas):", error);
    } else {
      console.log("Data inserted (agendas):", data);
    }

    setSeconds(0); // Reset detik setelah berhenti
  };
  // Format detik ke jam:menit:detik
  const formatTime = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-8">Track Agenda ⏱️</h1>
      
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 text-center">
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent border-b border-slate-600 mb-4 text-center text-xl focus:outline-none focus:border-blue-500"
        />

        <div className="mb-4 text-left">
          <label className="block text-sm text-slate-300 mb-2">Kategori</label>
          {categoriesError ? (
            <p className="text-sm text-red-400">{categoriesError}</p>
          ) : null}
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
        
        <div className="text-6xl font-mono font-bold mb-8">
          {formatTime(seconds)}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4 justify-center">
            {!isRunning ? (
              <button onClick={handleStart} className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-full font-bold transition">PLAY</button>
            ) : (
              <button onClick={handleStop} className="bg-red-600 hover:bg-red-500 px-8 py-3 rounded-full font-bold transition">STOP</button>
            )}
          </div>
          <Link href="/categories" className="text-sm text-slate-300 hover:text-white">
            Manage Category
          </Link>
        </div>
      </div>
    </main>
  )
}



