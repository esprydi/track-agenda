"use client";

import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";

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

export default function TrackerCalendar({ categories, trackers, isLoadingTrackers, trackersError, refreshTrackers }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [editingTrackerId, setEditingTrackerId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editSeconds, setEditSeconds] = useState(0);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  const selectedDateDetails = useMemo(() => {
    if (!selectedDateKey) return null;
    const items = trackersByDate[selectedDateKey] || [];
    return {
      date: selectedDateKey ? new Date(selectedDateKey) : null,
      items,
      totalSeconds: items.reduce((sum, tracker) => sum + (tracker.actual_duration_sec || 0), 0),
    };
  }, [selectedDateKey, trackersByDate]);

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

  const openEditTracker = (tracker) => {
    setEditingTrackerId(tracker.id);
    setEditTitle(tracker.title || "");
    const duration = tracker.actual_duration_sec || 0;
    setEditHours(Math.floor(duration / 3600));
    setEditMinutes(Math.floor((duration % 3600) / 60));
    setEditSeconds(duration % 60);
  };

  const handleSaveTrackerEdit = async () => {
    if (!editingTrackerId) return;
    setIsSavingEdit(true);
    const updatedSeconds = Math.max(0, editHours * 3600 + editMinutes * 60 + editSeconds);
    const { error } = await supabase
      .from("agendas")
      .update({ title: editTitle, actual_duration_sec: updatedSeconds })
      .eq("id", editingTrackerId);
    if (error) {
      console.error("Error updating tracker:", error);
    }
    await refreshTrackers?.();
    setIsSavingEdit(false);
    setEditingTrackerId(null);
  };

  const handleDeleteTracker = async (tracker) => {
    if (!tracker.id) return;
    if (!window.confirm("Hapus tracker ini dari kalender?")) return;
    const { error } = await supabase.from("agendas").delete().eq("id", tracker.id);
    if (error) {
      console.error("Error deleting tracker:", error);
      return;
    }
    await refreshTrackers?.();
    setSelectedDateKey((current) => current);
  };

  const cancelEdit = () => {
    setEditingTrackerId(null);
  };

  const closeDetailModal = () => {
    setSelectedDateKey(null);
    setEditingTrackerId(null);
  };

  return (
    <div className="mt-10 w-full max-w-5xl">
      <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Kalender Tracker</h2>
            <p className="mt-2 text-slate-400">Lihat catatan tracker yang sudah selesai per tanggal.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-900"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedDateKey(formatDateKey(today));
              }}
              className="rounded-full border border-slate-700 bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
            >
              Hari ini
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

          <div className="overflow-x-auto rounded-3xl bg-slate-950 p-2">
            <div className="min-w-md grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-wide text-slate-500">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((label) => (
                <div key={label} className="py-2">
                  {label}
                </div>
              ))}
            </div>

            <div className="min-w-md grid grid-cols-7 gap-2">
              {calendarCells.map((cell, index) => {
              const dayKey = formatDateKey(cell.date);
              const cellTrackers = cell.isValid ? trackersByDate[dayKey] || [] : [];
              const isToday = cell.isValid && dayKey === formatDateKey(new Date());
              const isSelected = cell.isValid && selectedDateKey === dayKey;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => cell.isValid && setSelectedDateKey(cell.isValid ? dayKey : null)}
                  className={`min-h-28 overflow-hidden rounded-3xl border p-3 text-left transition ${
                    cell.isValid
                      ? `${isSelected ? "border-blue-500 bg-slate-800" : "border-slate-700 bg-slate-900 hover:bg-slate-800"}`
                      : "border-transparent bg-slate-950/70 text-slate-500"
                  } ${cell.isValid ? "cursor-pointer" : "cursor-default"}`}
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
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

          {selectedDateDetails ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
              onClick={closeDetailModal}
            >
              <div
                className="w-full max-w-2xl overflow-hidden rounded-4xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-blue-200">Detail Tanggal</p>
                    <h4 className="text-2xl font-semibold text-white">
                      {selectedDateDetails.date.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </h4>
                    <p className="text-sm text-slate-400">Total durasi: {formatDuration(selectedDateDetails.totalSeconds)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDetailModal}
                    className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Tutup
                  </button>
                </div>
                <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                  {selectedDateDetails.items.length === 0 ? (
                    <p className="text-slate-400">Tidak ada tracker untuk tanggal ini.</p>
                  ) : (
                    selectedDateDetails.items.map((tracker) => {
                      const trackerColor = getCategoryColor(categories, tracker.category_id);
                      const isEditing = editingTrackerId === tracker.id;
                      return (
                        <div
                          key={tracker.id || `${tracker.category_id}-${tracker.created_at}`}
                          className="rounded-3xl border border-slate-800 bg-slate-950 p-4"
                        >
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm text-slate-400">Judul</label>
                                <input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-sm text-slate-400">Jam</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={editHours}
                                    onChange={(e) => setEditHours(Math.max(0, Number(e.target.value) || 0))}
                                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-slate-400">Menit</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={59}
                                    value={editMinutes}
                                    onChange={(e) => setEditMinutes(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-slate-400">Detik</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={59}
                                    value={editSeconds}
                                    onChange={(e) => setEditSeconds(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveTrackerEdit}
                                  disabled={isSavingEdit}
                                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                                >
                                  {isSavingEdit ? "Menyimpan..." : "Simpan"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: trackerColor }}
                                  />
                                  <p className="font-semibold text-white">{tracker.title || "Tanpa judul"}</p>
                                </div>
                                <p className="text-sm text-slate-400">{formatDuration(tracker.actual_duration_sec)}</p>
                              </div>
                              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-400">{new Date(tracker.created_at).toLocaleTimeString("id-ID")}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditTracker(tracker)}
                                    className="rounded-full bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-600"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTracker(tracker)}
                                    className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
