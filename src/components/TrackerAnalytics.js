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

const buildChartData = (trackers, rangeType, selectedDateObject, categories) => {
  const points = [];
  const labels = [];
  const values = [];

  if (rangeType === "date") {
    for (let hour = 0; hour < 24; hour += 1) {
      labels.push(`${hour}:00`);
      const count = trackers.reduce((sum, tracker) => {
        const created = new Date(tracker.created_at);
        return created.getFullYear() === selectedDateObject.getFullYear() &&
          created.getMonth() === selectedDateObject.getMonth() &&
          created.getDate() === selectedDateObject.getDate() &&
          created.getHours() === hour
          ? sum + (tracker.actual_duration_sec || 0)
          : sum;
      }, 0);
      values.push(count / 3600);
    }
  } else if (rangeType === "week") {
    const [monday] = getWeekRange(selectedDateObject);
    for (let day = 0; day < 7; day += 1) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + day);
      labels.push(current.toLocaleDateString("id-ID", { weekday: "short" }));
      const count = trackers.reduce((sum, tracker) => {
        const created = new Date(tracker.created_at);
        return created.getFullYear() === current.getFullYear() &&
          created.getMonth() === current.getMonth() &&
          created.getDate() === current.getDate()
          ? sum + (tracker.actual_duration_sec || 0)
          : sum;
      }, 0);
      values.push(count / 3600);
    }
  } else if (rangeType === "month") {
    const [start, end] = getMonthRange(selectedDateObject);
    const days = end.getDate();
    for (let day = 1; day <= days; day += 1) {
      const current = new Date(selectedDateObject.getFullYear(), selectedDateObject.getMonth(), day);
      labels.push(String(day));
      const count = trackers.reduce((sum, tracker) => {
        const created = new Date(tracker.created_at);
        return created.getFullYear() === current.getFullYear() &&
          created.getMonth() === current.getMonth() &&
          created.getDate() === current.getDate()
          ? sum + (tracker.actual_duration_sec || 0)
          : sum;
      }, 0);
      values.push(count / 3600);
    }
  } else if (rangeType === "year") {
    for (let month = 0; month < 12; month += 1) {
      const current = new Date(selectedDateObject.getFullYear(), month, 1);
      labels.push(current.toLocaleString("id-ID", { month: "short" }));
      const count = trackers.reduce((sum, tracker) => {
        const created = new Date(tracker.created_at);
        return created.getFullYear() === current.getFullYear() &&
          created.getMonth() === current.getMonth()
          ? sum + (tracker.actual_duration_sec || 0)
          : sum;
      }, 0);
      values.push(count / 3600);
    }
  }

  const maxValue = Math.max(...values, 1);
  const width = 560;
  const height = 220;
  const padding = 28;
  const pointCount = values.length;

  const pointsString = values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(pointCount - 1, 1);
      const y = height - padding - (value / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return {
    labels,
    values,
    pointsString,
    width,
    height,
    padding,
    maxValue,
  };
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

  const chartData = useMemo(
    () => buildChartData(trackersInRange, rangeType, selectedDateObject, categories),
    [trackersInRange, rangeType, selectedDateObject, categories]
  );

  const totalChartHours = useMemo(
    () => chartData.values.reduce((sum, value) => sum + value, 0),
    [chartData.values]
  );

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

        <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Grafik garis durasi</h3>
              <p className="mt-1 text-sm text-slate-400">Total jam dalam interval {getRangeLabel(rangeType)}.</p>
            </div>
            <div className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200">
              {totalChartHours.toFixed(1)} jam
            </div>
          </div>

          {isLoadingTrackers ? (
            <p className="mt-4 text-slate-400">Memuat grafik...</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full max-w-full overflow-visible rounded-3xl bg-slate-950">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 1, 2, 3, 4].map((line) => {
                  const y = chartData.padding + ((chartData.height - chartData.padding * 2) / 4) * line;
                  return (
                    <line
                      key={line}
                      x1={chartData.padding}
                      y1={y}
                      x2={chartData.width - chartData.padding}
                      y2={y}
                      stroke="#334155"
                      strokeWidth="1"
                    />
                  );
                })}

                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={chartData.pointsString}
                />

                <polygon
                  fill="url(#areaGradient)"
                  points={`${chartData.pointsString} ${chartData.width - chartData.padding},${chartData.height - chartData.padding} ${chartData.padding},${chartData.height - chartData.padding}`}
                />

                {chartData.pointsString.split(" ").map((point, index) => {
                  const [x, y] = point.split(",").map(Number);
                  return (
                    <circle key={`${x}-${y}-${index}`} cx={x} cy={y} r="4" fill="#38bdf8" />
                  );
                })}
              </svg>

              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-slate-400 sm:grid-cols-6">
                {chartData.labels.map((label, index) =>
                  index % Math.max(1, Math.floor(chartData.labels.length / 6)) === 0 ? (
                    <span key={label + index}>{label}</span>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
