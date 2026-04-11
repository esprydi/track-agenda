"use client";

import { useMemo, useState } from "react";

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}j ${minutes}m`;
};

const formatDateString = (date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

const getWeekRange = (date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(current);
  monday.setDate(current.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [monday, sunday];
};

const getMonthRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return [start, end];
};

const getYearRange = (date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31);
  return [start, end];
};

const getRangeLabel = (rangeType) => {
  switch (rangeType) {
    case "date":
      return "Harian";
    case "week":
      return "Mingguan";
    case "month":
      return "Bulanan";
    case "year":
      return "Tahunan";
    default:
      return "Interval";
  }
};

export default function TrackerAnalytics({ categories, trackers, isLoadingTrackers }) {
  const [rangeType, setRangeType] = useState("date");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const selectedDateObject = useMemo(() => new Date(selectedDate), [selectedDate]);

  const [rangeStart, rangeEnd] = useMemo(() => {
    if (rangeType === "week") return getWeekRange(selectedDateObject);
    if (rangeType === "month") return getMonthRange(selectedDateObject);
    if (rangeType === "year") return getYearRange(selectedDateObject);
    return [selectedDateObject, selectedDateObject];
  }, [rangeType, selectedDateObject]);

  const trackersInRange = useMemo(() => {
    const startTime = rangeStart.setHours(0, 0, 0, 0);
    const endTime = rangeEnd.setHours(23, 59, 59, 999);
    return trackers.filter((tracker) => {
      if (!tracker.created_at) return false;
      const trackerTime = new Date(tracker.created_at).getTime();
      return trackerTime >= startTime && trackerTime <= endTime;
    });
  }, [trackers, rangeStart, rangeEnd]);

  const totalSeconds = useMemo(
    () => trackersInRange.reduce((sum, tracker) => sum + (tracker.actual_duration_sec || 0), 0),
    [trackersInRange]
  );

  const categorySummary = useMemo(() => {
    return trackersInRange.reduce((acc, tracker) => {
      const key = tracker.category_id || "unknown";
      acc[key] = (acc[key] || 0) + (tracker.actual_duration_sec || 0);
      return acc;
    }, {});
  }, [trackersInRange]);

  const summaryItems = useMemo(() => {
    return Object.entries(categorySummary).map(([categoryId, seconds]) => {
      const category = categories.find((category) => category.id === categoryId);
      return {
        id: categoryId,
        name: category?.name || "Tanpa Kategori",
        color: category?.color_code || "#3b82f6",
        seconds,
      };
    });
  }, [categorySummary, categories]);

  const rangeLabel = useMemo(() => {
    if (rangeType === "date") {
      return formatDateString(rangeStart);
    }
    if (rangeType === "week") {
      return `${formatDateString(rangeStart)} - ${formatDateString(rangeEnd)}`;
    }
    if (rangeType === "month") {
      return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(rangeStart);
    }
    if (rangeType === "year") {
      return selectedDateObject.getFullYear();
    }
    return "";
  }, [rangeType, rangeStart, rangeEnd, selectedDateObject]);

  return (
    <div className="mt-10 w-full max-w-5xl">
      <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Analisis Tracker</h2>
            <p className="mt-2 text-slate-400">Lihat total jam per kategori dan keseluruhan berdasarkan interval waktu.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "date", label: "Tanggal" },
              { value: "week", label: "Minggu" },
              { value: "month", label: "Bulan" },
              { value: "year", label: "Tahun" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRangeType(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  rangeType === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-950 text-slate-200 hover:bg-slate-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4 rounded-3xl border border-slate-700 bg-slate-950 p-5">
            <div>
              <label className="block text-sm text-slate-400">Tanggal Referensi</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="rounded-3xl bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Interval</p>
              <p className="mt-1 text-lg font-semibold text-white">{rangeLabel}</p>
            </div>
            <div className="rounded-3xl bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Total jam</p>
              <p className="mt-2 text-3xl font-bold text-white">{formatDuration(totalSeconds)}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5">
            <h3 className="text-lg font-semibold text-white">Ringkasan per kategori</h3>
            {isLoadingTrackers ? (
              <p className="mt-4 text-slate-400">Memuat data tracker...</p>
            ) : summaryItems.length === 0 ? (
              <p className="mt-4 text-slate-400">Tidak ada tracker untuk interval ini.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {summaryItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">{formatDuration(item.seconds)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">{((item.seconds / totalSeconds) * 100 || 0).toFixed(0)}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
