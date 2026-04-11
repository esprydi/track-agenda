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
  const [startTimestamp, setStartTimestamp] = useState(null);
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
  const [completionMessage, setCompletionMessage] = useState("");
  const [alarmPlayCount, setAlarmPlayCount] = useState(0);

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
    const now = audioCtx.currentTime;

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.linearRampToValueAtTime(880, now + 0.6);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
    gain.gain.setValueAtTime(0.18, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start(now);
    oscillator.stop(now + 1.2);
    oscillator.onended = () => audioCtx.close();
  }, []);

  useEffect(() => {
    if (!isRunning || startTimestamp === null) return undefined;

    const updateTimer = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
      if (countdownTargetSeconds > 0) {
        setSeconds((prev) => {
          const remaining = Math.max(countdownTargetSeconds - elapsedSeconds, 0);
          return remaining;
        });
      } else {
        setSeconds(elapsedSeconds);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [isRunning, startTimestamp, countdownTargetSeconds]);

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

    setStartTimestamp(Date.now());
    setIsRunning(true);
  };

  const handleStop = useCallback(async () => {
    setIsRunning(false);
    setStartTimestamp(null);
    const actualDuration = countdownTargetSeconds > 0 ? countdownTargetSeconds - seconds : seconds;
    setCompletionMessage(
      `Hebat! Kamu sudah fokus selama ${actualDuration} detik untuk "${title || "kegiatanmu"}". Terus semangat dan rayakan setiap kemajuan kecil!`
    );
    setAlarmPlayCount(1);
    playAlarm();

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
  }, [countdownTargetSeconds, seconds, title, categoryId, fetchTrackers, playAlarm]);

  const closeCompletionModal = () => {
    setCompletionMessage("");
    setAlarmPlayCount(0);
  };

  useEffect(() => {
    if (!completionMessage || alarmPlayCount === 0 || alarmPlayCount >= 7) return;
    const timer = setTimeout(() => {
      if (alarmPlayCount < 7) {
        playAlarm();
        setAlarmPlayCount((count) => count + 1);
      }
    }, 1400);
    return () => clearTimeout(timer);
  }, [completionMessage, alarmPlayCount, playAlarm]);

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
        refreshTrackers={fetchTrackers}
      />

      <TrackerAnalytics
        categories={categories}
        trackers={trackers}
        isLoadingTrackers={isLoadingTrackers}
      />

      {completionMessage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          onClick={closeCompletionModal}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-4xl border border-slate-700 bg-slate-900 p-6 shadow-2xl motion-safe:animate-pulse"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 text-center">
              <div className="mt-4 flex flex-col items-center gap-3">
                <span className="text-5xl animate-bounce">🏆</span>
                <h3 className="text-2xl font-semibold text-white">Selamat! Kamu berhasil.</h3>
              </div>
            </div>
            <p className="text-slate-200">{completionMessage}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeCompletionModal}
                className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}



