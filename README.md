# Mini Event Management — Docker + MySQL

Repository tugas Cloud Computing. Versi target menjalankan aplikasi Mini Event Management (Next.js), aplikasi PHP, dan satu MySQL bersama melalui Docker Compose.

 > **Status migrasi:** sedang dikerjakan. Source aplikasi utama sudah banyak dialihkan ke MySQL, tetapi build dan pengujian end-to-end setelah batch migrasi terbaru belum selesai. Demo lintas aplikasi kini memakai schema event utama yang sama; belum diuji ulang pada schema final ini.

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

## Integrasi event PHP ↔ Next.js

Kedua aplikasi menggunakan tabel `events` yang sama pada schema Mini Event Management. Untuk demo lintas aplikasi, tentukan grup Owner yang sama melalui `PHP_DEFAULT_GROUP_ID` di file `.env` lokal. Nilainya adalah ID grup yang dibuat dari onboarding aplikasi Next.js. PHP dan endpoint demo Next.js membatasi operasi event ke grup tersebut.

Jangan mengekspos aplikasi demo ini ke internet publik tanpa menambahkan autentikasi/otorisasi untuk PHP. Konfigurasi group ID hanya membatasi cakupan data; konfigurasi ini bukan pengganti autentikasi pengguna.

## Catatan database

Skrip pada `database/init/` hanya dijalankan otomatis oleh image MySQL ketika direktori data masih kosong. Untuk volume yang sudah pernah dipakai, perubahan schema harus diterapkan sebagai migrasi terencana setelah backup; menambahkan file init baru tidak otomatis mengubah volume lama.

Schema domain MySQL untuk migrasi aplikasi tersedia di `database/migrations/001_mini_event_management_mysql.sql` dan juga menjadi skrip init untuk volume baru. File init lama yang membuat tabel demo dengan ID numerik telah dihapus agar tidak mendahului schema domain. Schema masih perlu diuji pada MySQL 8.4. Volume lama tidak akan berubah otomatis.

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
