"use client";

import { useCallback, useEffect, useState } from "react";

const initialForm = {
  name: "",
  description: "",
  event_date: "",
  location: "",
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default function MysqlEventsPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/docker-events", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal memuat event.");
      setEvents(result.data || []);
    } catch (err) {
      setError(err.message || "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitEvent(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/docker-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Event gagal disimpan.");
      setForm(initialForm);
      setNotice("Event berhasil disimpan ke MySQL.");
      await loadEvents();
    } catch (err) {
      setError(err.message || "Event gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Docker · Shared Database
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Event Management
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Halaman demo Next.js yang membaca dan menulis data ke database
            MySQL bersama dengan aplikasi PHP.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={submitEvent}
            className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold">Tambah event</h2>
            <p className="mt-1 text-sm text-slate-400">
              Data yang disimpan juga dapat dibaca dari aplikasi PHP.
            </p>

            <label className="mt-5 block text-sm font-medium text-slate-300">
              Nama event *
              <input
                required
                maxLength={150}
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Contoh: Seminar Cloud Computing"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-300">
              Tanggal event *
              <input
                required
                type="date"
                name="event_date"
                value={form.event_date}
                onChange={updateField}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-300">
              Lokasi
              <input
                name="location"
                value={form.location}
                onChange={updateField}
                placeholder="Contoh: Laboratorium Komputer"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-300">
              Deskripsi
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={updateField}
                placeholder="Informasi singkat mengenai event"
                className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>

            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-red-950/60 p-3 text-sm text-red-300">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="mt-4 rounded-lg bg-emerald-950/60 p-3 text-sm text-emerald-300">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan event"}
            </button>
          </form>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Daftar event</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Sumber data: MySQL · tabel events
                </p>
              </div>
              <button
                type="button"
                onClick={loadEvents}
                disabled={loading}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-50"
              >
                {loading ? "Memuat..." : "Muat ulang"}
              </button>
            </div>

            {loading ? (
              <p className="py-12 text-center text-sm text-slate-400">
                Memuat data event...
              </p>
            ) : events.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-700 px-4 py-12 text-center">
                <p className="font-medium text-slate-300">Belum ada event</p>
                <p className="mt-1 text-sm text-slate-500">
                  Tambahkan event menggunakan formulir di sebelah kiri.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {events.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-semibold text-white">{item.name}</h3>
                      <span className="rounded-full bg-cyan-950 px-3 py-1 text-xs font-medium text-cyan-300">
                        #{item.id}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {formatDate(item.event_date)}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                    {item.description && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                        {item.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>

        <p className="mt-6 text-center text-xs text-slate-600">
          Demo integrasi lintas aplikasi · Next.js ↔ MySQL ↔ PHP
        </p>
      </div>
    </main>
  );
}
