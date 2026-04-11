"use client";

import { useMemo, useState } from "react";

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
  return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
};

const getCategoryColor = (categories, categoryId) =>
  categories.find((category) => category.id === categoryId)?.color_code || "#3b82f6";

export default function TrackerCalendar({ categories, trackers, isLoadingTrackers, trackersError }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDayIndex = monthStart.getDay();

  const trackersByDate = useMemo(() => {
    return trackers.reduce((acc, tracker) => {
      if (!tracker.created_at) return acc;
      const date = new Date(tracker.created_at);
      const key = formatDateKey(date);
      if (!acc[key]) acc[key] = [];
      acc[key].push(tracker);
      return acc;
    }, {});
  }, [trackers]);

  const calendarCells = useMemo(() => {
    const totalCells = Math.ceil((startDayIndex + monthDays) / 7) * 7;
    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startDayIndex + 1;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
      return {
        date,
        isValid: dayNumber >= 1 && dayNumber <= monthDays,
      };
    });
  }, [currentMonth, monthDays, startDayIndex]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
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
              {isLoadingTrackers
                ? "Memuat data tracker..."
                : trackers.length === 0
                ? "Belum ada tracker selesai."
                : `${trackers.length} tracker tersimpan`}
            </div>
          </div>

          {trackersError ? (
            <p className="rounded-2xl bg-red-950/50 p-3 text-sm text-red-300">{trackersError}</p>
          ) : null}

          <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-wide text-slate-500">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((label) => (
              <div key={label} className="py-2">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, index) => {
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
                        {isToday ? (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] uppercase text-white">
                            Hari ini
                          </span>
                        ) : null}
                      </div>
                      {cellTrackers.length === 0 ? (
                        <p className="text-xs text-slate-500">Tidak ada tracker</p>
                      ) : (
                        <ul className="space-y-2">
                          {cellTrackers.map((tracker) => {
                            const trackerColor = getCategoryColor(categories, tracker.category_id);
                            return (
                              <li
                                key={tracker.id}
                                className="rounded-2xl border bg-slate-950 p-2 text-xs"
                                style={{ borderColor: trackerColor }}
                              >
                                <div className="mb-2 flex items-center gap-2">
                                  <span
                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: trackerColor }}
                                  />
                                  <p className="font-semibold text-slate-100 truncate">{tracker.title}</p>
                                </div>
                                <p className="text-slate-400">{formatDuration(tracker.actual_duration_sec)} selesai</p>
                              </li>
                            );
                          })}
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
  );
}
