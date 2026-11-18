# Mini Event Management — Docker + MySQL

Repository tugas Cloud Computing. Versi target menjalankan aplikasi Mini Event Management (Next.js), aplikasi PHP, dan satu MySQL bersama melalui Docker Compose.

> **Status migrasi:** sedang dikerjakan. Halaman demo `/mysql-events` sudah pernah diuji dua arah dengan PHP, tetapi aplikasi utama Mini Event Management belum selesai dimigrasikan dari Supabase ke MySQL. Jangan anggap seluruh fitur sudah siap.

## Target arsitektur

- **Next.js**: aplikasi Mini Event Management utama.
- **PHP**: aplikasi kedua untuk demonstrasi penggunaan database bersama.
- **MySQL**: satu database yang digunakan kedua aplikasi.
- **Docker Compose**: satu network bersama dan named volume untuk persistensi.

## Fitur aplikasi yang menjadi cakupan migrasi

Autentikasi Owner/Panitia, onboarding grup, event, anggota dan susunan panitia, divisi, rundown, tugas, pengadaan, kategori anggaran, transaksi keuangan, undangan anggota, serta logo grup.

UI dan validasi aplikasi akan dipertahankan sejauh memungkinkan. Supabase Auth, PostgREST queries, RPC, dan Storage perlu diganti dengan layanan MySQL/server-side yang setara.

## Struktur penting

- `docker-compose.yml`: orkestrasi service.
- `database/init/`: skrip inisialisasi MySQL untuk volume baru.
- `database/migrations/`: perubahan schema yang perlu diterapkan secara eksplisit, termasuk `001_mini_event_management_mysql.sql` dan `002_group_logo_blob_storage.sql`.
- `app-php/`: aplikasi PHP.
- `mini-event-management/app-next/`: aplikasi Next.js.

## Menjalankan Docker

Pastikan file `.env` lokal sudah dibuat dari `.env.example`, kemudian:

```bash
docker compose config
docker compose up --build -d
docker compose ps
```

Jangan menjalankan `docker compose down -v` jika ingin mempertahankan data MySQL.

## Catatan database

Skrip pada `database/init/` hanya dijalankan otomatis oleh image MySQL ketika direktori data masih kosong. Untuk volume yang sudah pernah dipakai, perubahan schema harus diterapkan sebagai migrasi terencana setelah backup; menambahkan file init baru tidak otomatis mengubah volume lama.

Schema domain MySQL awal untuk migrasi aplikasi tersedia di `database/migrations/001_mini_event_management_mysql.sql`. Schema ini masih perlu diverifikasi pada MySQL 8.4 dan diselaraskan dengan migrasi aplikasi sebelum digunakan pada database yang sudah berisi data.

## Status dan rencana

1. Audit skema dan ketergantungan Supabase.
2. Siapkan schema MySQL domain dan autentikasi.
3. Implementasikan autentikasi/session MySQL.
4. Migrasikan seluruh Server Actions dan query Server Components.
5. Ganti Supabase Storage untuk logo grup.
6. Pastikan PHP dan Next.js memakai tabel MySQL yang sama.
7. Build, uji fitur, uji keamanan akses data, dan uji persistensi.
8. Lengkapi dokumentasi serta bukti demo.

Lihat `PROJECT_PROGRESS_LOG.md` dan `PROJECT_CONTEXT_DOCKER_SHARED_MYSQL.md` untuk catatan detail.
