"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase.js";
import TrackerForm from "../components/TrackerForm";
import TrackerCalendar from "../components/TrackerCalendar";
import TrackerAnalytics from "../components/TrackerAnalytics";

export default function Home() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [trackers, setTrackers] = useState([]);
  const [isLoadingTrackers, setIsLoadingTrackers] = useState(true);
  const [trackersError, setTrackersError] = useState("");
  const [isCustomTimer, setIsCustomTimer] = useState(false);
  const [countdownHours, setCountdownHours] = useState(0);
  const [countdownMinutes, setCountdownMinutes] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [countdownTargetSeconds, setCountdownTargetSeconds] = useState(0);

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

  const playAlarm = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.2;

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
    oscillator.onended = () => audioCtx.close();
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) =>
          countdownTargetSeconds > 0 ? Math.max(prev - 1, 0) : prev + 1
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, countdownTargetSeconds]);

  const toggleCustomTimer = useCallback((value) => {
    setIsCustomTimer(value);
    if (!value) {
      setCountdownHours(0);
      setCountdownMinutes(0);
      setCountdownSeconds(0);
      setCountdownTargetSeconds(0);
    }
  }, []);

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

    const normalizedHours = Math.max(0, Math.floor(countdownHours));
    const normalizedMinutes = Math.max(0, Math.floor(countdownMinutes));
    const normalizedSeconds = Math.min(
      59,
      Math.max(0, Math.floor(countdownSeconds))
    );
    const targetSeconds = isCustomTimer
      ? normalizedHours * 3600 + normalizedMinutes * 60 + normalizedSeconds
      : 0;

    if (targetSeconds > 0) {
      setSeconds(targetSeconds);
      setCountdownTargetSeconds(targetSeconds);
    } else {
      setSeconds(0);
      setCountdownTargetSeconds(0);
    }

    setIsRunning(true);
  };

  const handleStop = useCallback(async () => {
    setIsRunning(false);
    const actualDuration = countdownTargetSeconds > 0 ? countdownTargetSeconds - seconds : seconds;
    alert(`Hebat! Kamu sudah fokus selama ${actualDuration} detik untuk "${title}".`);

    const { data, error } = await supabase.from("agendas").insert([
      {
        title: title,
        actual_duration_sec: actualDuration,
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
    setCountdownTargetSeconds(0);
  }, [countdownTargetSeconds, seconds, title, categoryId, fetchTrackers]);

  useEffect(() => {
    if (!isRunning || countdownTargetSeconds === 0 || seconds !== 0) return;
    const timer = setTimeout(() => {
      playAlarm();
      handleStop();
    }, 0);
    return () => clearTimeout(timer);
  }, [seconds, isRunning, countdownTargetSeconds, playAlarm, handleStop]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-10">
      <div className="mb-6 flex w-full max-w-4xl flex-col gap-3 rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            <span aria-hidden="true">⏱️</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Jejak Waktu</p>
            <h1 className="text-2xl font-semibold text-slate-100">Time Tracker</h1>
            <p className="mt-1 text-sm text-slate-400">Catat fokus, pantau durasi, dan jaga produktivitas setiap hari.</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end sm:flex-row sm:gap-3">
          <Link
            href="/categories"
            className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Manage Category
          </Link>
        </div>
      </div>

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
        isCustomTimer={isCustomTimer}
        toggleCustomTimer={toggleCustomTimer}
        countdownHours={countdownHours}
        setCountdownHours={setCountdownHours}
        countdownMinutes={countdownMinutes}
        setCountdownMinutes={setCountdownMinutes}
        countdownSeconds={countdownSeconds}
        setCountdownSeconds={setCountdownSeconds}
        countdownTargetSeconds={countdownTargetSeconds}
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



