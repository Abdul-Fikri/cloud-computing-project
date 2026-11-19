import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getMysqlPool } from "@/lib/mysql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDemoGroupId() {
  return String(process.env.PHP_DEFAULT_GROUP_ID || "").trim();
}

export async function GET() {
  const groupId = getDemoGroupId();
  if (!groupId) {
    return NextResponse.json(
      { error: "PHP_DEFAULT_GROUP_ID belum diatur pada environment Docker." },
      { status: 503 }
    );
  }

  try {
    const [rows] = await getMysqlPool().execute(
      `SELECT id, name, description, start_date AS event_date, location, status, created_at, updated_at
       FROM events
       WHERE group_id = ?
       ORDER BY start_date ASC, created_at DESC`,
      [groupId]
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Gagal mengambil event demo dari MySQL:", error);
    return NextResponse.json(
      { error: "Data event gagal dimuat. Pastikan schema dan grup demo tersedia." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const groupId = getDemoGroupId();
  if (!groupId) {
    return NextResponse.json(
      { error: "PHP_DEFAULT_GROUP_ID belum diatur pada environment Docker." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const eventDate = typeof body.event_date === "string" ? body.event_date.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "";

    if (!name || name.length > 160) {
      return NextResponse.json(
        { error: "Nama event wajib diisi dan maksimal 160 karakter." },
        { status: 400 }
      );
    }
    if (description.length > 2000 || location.length > 200) {
      return NextResponse.json(
        { error: "Deskripsi maksimal 2000 karakter dan lokasi maksimal 200 karakter." },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      return NextResponse.json(
        { error: "Tanggal event wajib menggunakan format YYYY-MM-DD." },
        { status: 400 }
      );
    }
    const parsedDate = new Date(`${eventDate}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== eventDate) {
      return NextResponse.json({ error: "Tanggal event tidak valid." }, { status: 400 });
    }

    const id = randomUUID();
    const pool = getMysqlPool();
    const [groups] = await pool.execute("SELECT id FROM `groups` WHERE id = ? LIMIT 1", [groupId]);
    if (!groups.length) {
      return NextResponse.json({ error: "Grup demo tidak ditemukan." }, { status: 404 });
    }

    await pool.execute(
      `INSERT INTO events (id, group_id, name, description, start_date, location, status_mode, status)
       VALUES (?, ?, ?, ?, ?, ?, 'automatic', 'planned')`,
      [id, groupId, name, description || null, eventDate, location || null]
    );
    const [rows] = await pool.execute(
      `SELECT id, name, description, start_date AS event_date, location, status, created_at, updated_at
       FROM events WHERE id = ? AND group_id = ? LIMIT 1`,
      [id, groupId]
    );
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Gagal menyimpan event demo ke MySQL:", error);
    return NextResponse.json(
      { error: "Event gagal disimpan. Periksa koneksi database dan struktur tabel." },
      { status: 500 }
    );
  }
}
