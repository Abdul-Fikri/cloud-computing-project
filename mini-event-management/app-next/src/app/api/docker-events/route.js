import { NextResponse } from "next/server";
import { getMysqlPool } from "@/lib/mysql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = getMysqlPool();
    const [rows] = await pool.execute(
      `SELECT id, name, description, event_date, location, created_at, updated_at
       FROM events
       ORDER BY event_date ASC, id DESC`
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Gagal mengambil data event MySQL:", error);
    return NextResponse.json(
      { error: "Data event gagal dimuat. Pastikan database dan tabel events tersedia." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const eventDate =
      typeof body.event_date === "string" ? body.event_date.trim() : "";
    const location =
      typeof body.location === "string" ? body.location.trim() : "";

    if (!name || name.length > 150) {
      return NextResponse.json(
        { error: "Nama event wajib diisi dan maksimal 150 karakter." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      return NextResponse.json(
        { error: "Tanggal event wajib menggunakan format YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const pool = getMysqlPool();
    const [result] = await pool.execute(
      `INSERT INTO events (name, description, event_date, location)
       VALUES (?, ?, ?, ?)`,
      [name, description || null, eventDate, location || null]
    );

    const [rows] = await pool.execute(
      `SELECT id, name, description, event_date, location, created_at, updated_at
       FROM events WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Gagal menyimpan event ke MySQL:", error);
    return NextResponse.json(
      { error: "Event gagal disimpan. Periksa koneksi database dan struktur tabel." },
      { status: 500 }
    );
  }
}
