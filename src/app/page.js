"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import TrackerForm from "../components/TrackerForm";
import TrackerCalendar from "../components/TrackerCalendar";
import TrackerAnalytics from "../components/TrackerAnalytics";

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

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,color_code")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      setCategoriesError(`Gagal memuat kategori: ${error.message}`);
      setCategories([]);
    } else {
      setCategories(data || []);
      setCategoriesError("");
    }
    setIsLoadingCategories(false);
  }, []);

  const fetchTrackers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchCategories);
  }, [fetchCategories]);

  useEffect(() => {
    Promise.resolve().then(fetchTrackers);
  }, [fetchTrackers]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

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

  const handleStop = async () => {
    setIsRunning(false);
    alert(`Hebat! Kamu sudah fokus selama ${seconds} detik untuk "${title}".`);

    const { data, error } = await supabase.from("agendas").insert([
      {
        title: title,
        actual_duration_sec: seconds,
        status: "completed",
        category_id: categoryId,
      },
    ]);

    if (error) {
      console.error("Error inserting data (agendas):", error);
    } else {
      console.log("Data inserted (agendas):", data);
      fetchTrackers();
    }

    setSeconds(0);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-8">Track Agenda ⏱️</h1>

      <TrackerForm
        title={title}
        setTitle={setTitle}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        categories={categories}
        categoriesError={categoriesError}
        isLoadingCategories={isLoadingCategories}
        isRunning={isRunning}
        onStart={handleStart}
        onStop={handleStop}
        seconds={seconds}
      />

      <TrackerCalendar
        categories={categories}
        trackers={trackers}
        isLoadingTrackers={isLoadingTrackers}
        trackersError={trackersError}
      />

      <TrackerAnalytics
        categories={categories}
        trackers={trackers}
        isLoadingTrackers={isLoadingTrackers}
      />
    </main>
  );
}



