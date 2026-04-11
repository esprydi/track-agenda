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
  const [trackers, setTrackers] = useState([]);
  const [isLoadingTrackers, setIsLoadingTrackers] = useState(true);
  const [trackersError, setTrackersError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  
  const getCategoryLabel = (category) =>
    category.name ?? category.title ?? category.category ?? category.label ?? category.id;

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  const trackersByDate = trackers.reduce((acc, tracker) => {
    if (!tracker.created_at) return acc;
    const date = new Date(tracker.created_at);
    const key = formatDateKey(date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(tracker);
    return acc;
  }, {});

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDayIndex = monthStart.getDay();

  const getCalendarCells = () => {
    const totalCells = Math.ceil((startDayIndex + monthDays) / 7) * 7;
    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startDayIndex + 1;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
      return {
        date,
        isValid: dayNumber >= 1 && dayNumber <= monthDays,
      };
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

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

  useEffect(() => {
    const fetchTrackers = async () => {
      setIsLoadingTrackers(true);
      const { data, error } = await supabase
        .from("agendas")
        .select("id,title,actual_duration_sec,category_id,created_at")
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching trackers:", error);
        setTrackersError(error.message || "Gagal memuat tracker.");
        setTrackers([]);
      } else {
        setTrackers(data || []);
        setTrackersError("");
      }
      setIsLoadingTrackers(false);
    };

    fetchTrackers();
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

      <div className="mt-10 w-full max-w-5xl">
        <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Kalender Tracker</h2>
              <p className="mt-2 text-slate-400">Lihat catatan tracker yang sudah selesai per tanggal.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-900"
              >
                Sebelumnya
              </button>
              <button
                onClick={handleNextMonth}
                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-900"
              >
                Berikutnya
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950 p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </p>
                <p className="text-sm text-slate-400">Tanggal tracker disimpan berdasarkan waktu selesai.</p>
              </div>
              <div className="text-sm text-slate-400">
                {isLoadingTrackers ? "Memuat data tracker..." : trackers.length === 0 ? "Belum ada tracker selesai." : `${trackers.length} tracker tersimpan`}
              </div>
            </div>

            {trackersError ? (
              <p className="rounded-2xl bg-red-950/50 p-3 text-sm text-red-300">{trackersError}</p>
            ) : null}

            <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-wide text-slate-500">
              {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map((label) => (
                <div key={label} className="py-2">{label}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getCalendarCells().map((cell, index) => {
                const dayKey = formatDateKey(cell.date);
                const cellTrackers = cell.isValid ? trackersByDate[dayKey] || [] : [];
                const isToday = cell.isValid && dayKey === formatDateKey(new Date());

                return (
                  <div
                    key={index}
                    className={`min-h-30 overflow-hidden rounded-3xl border p-3 text-left ${
                      cell.isValid ? "border-slate-700 bg-slate-900" : "border-transparent bg-slate-950/70 text-slate-500"
                    }`}
                  >
                    {cell.isValid ? (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold">{cell.date.getDate()}</span>
                          {isToday ? <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] uppercase text-white">Hari ini</span> : null}
                        </div>
                        {cellTrackers.length === 0 ? (
                          <p className="text-xs text-slate-500">Tidak ada tracker</p>
                        ) : (
                          <ul className="space-y-2">
                            {cellTrackers.map((tracker) => (
                              <li key={tracker.id} className="rounded-2xl border border-slate-700 bg-slate-950 p-2 text-xs">
                                <p className="font-semibold text-slate-100 truncate">{tracker.title}</p>
                                <p className="text-slate-400">{formatDuration(tracker.actual_duration_sec)} selesai</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}



