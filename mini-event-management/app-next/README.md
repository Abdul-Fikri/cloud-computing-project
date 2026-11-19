# Mini Event Management — Docker/MySQL Variant

Ini adalah salinan aplikasi Mini Event Management yang dimigrasikan khusus untuk repository tugas Cloud Computing. **Jangan menyamakan konfigurasi branch ini dengan deployment production atau repository aplikasi asal.**

## Tech stack
- Next.js 16 App Router, React 19, JavaScript.
- Tailwind CSS 4.
- MySQL 8.4 melalui `mysql2/promise`.
- Autentikasi berbasis sesi MySQL (cookie HttpOnly) dan password hash scrypt.
- Zod 4 untuk validasi.

## Environment
Konfigurasi lokal disediakan melalui `.env.example` pada root repository. Untuk Docker Compose, service Next.js dan PHP terhubung ke service database bernama `mysql` pada network bersama. Jangan commit file `.env` atau kredensial.

## Menjalankan lokal
Dari root repository:
```bash
docker compose config
docker compose up --build -d
docker compose ps
```
Jangan gunakan `docker compose down -v` karena akan menghapus named volume database.

## Fitur
Autentikasi Owner/Panitia, onboarding grup, event, anggota, susunan panitia, divisi, rundown, tugas, pengadaan, keuangan, undangan anggota, dan logo grup tersimpan di MySQL.

## Integrasi PHP ↔ Next.js
Kedua aplikasi berbagi tabel `events`. Variabel `PHP_DEFAULT_GROUP_ID` membatasi demo ke satu grup Owner. Endpoint demo tidak memiliki autentikasi pengguna dan hanya boleh dipakai di lingkungan lokal/terisolasi.

## Validasi
GitHub Actions menjalankan `npm ci`, ESLint, build Next.js, PHP syntax lint, dan validasi konfigurasi Docker Compose. Status workflow terbaru perlu diperiksa sebelum merge. Pengujian lokal menyeluruh dan migrasi volume lama masih menjadi prasyarat merge.

## Batasan keselamatan
- Perubahan hanya untuk repository tugas Cloud Computing.
- Jangan mengubah atau deploy repository production `Abdul-Fikri/mini-event-management`.
- Jangan reset atau menghapus volume MySQL yang sudah berisi data.
- Direktori `supabase/` yang tersisa menyimpan schema/migration historis aplikasi asal; runtime branch ini menggunakan MySQL.
