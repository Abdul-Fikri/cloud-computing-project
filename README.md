# Mini Event Management — Docker + MySQL

Repository tugas Cloud Computing. Versi target menjalankan aplikasi Mini Event Management (Next.js), aplikasi PHP, dan satu MySQL bersama melalui Docker Compose.

> **Status migrasi:** source aplikasi utama telah dialihkan ke MySQL untuk alur Owner/Panitia, fitur domain, dan penyimpanan logo. GitHub Actions pada commit `9156e10` telah lulus untuk `npm ci`, ESLint, build Next.js, PHP syntax, dan validasi Docker Compose. Perubahan sesudahnya juga sedang divalidasi CI. Pengujian end-to-end Docker dan verifikasi upgrade volume MySQL lama masih belum dilakukan.

## Target arsitektur

- **Next.js**: aplikasi Mini Event Management utama.
- **PHP**: aplikasi kedua untuk demonstrasi penggunaan database bersama.
- **MySQL**: satu database yang digunakan kedua aplikasi.
- **Docker Compose**: satu network bersama dan named volume untuk persistensi.

## Fitur aplikasi yang menjadi cakupan migrasi

Autentikasi Owner/Panitia, onboarding grup, event, anggota dan susunan panitia, divisi, rundown, tugas, pengadaan, kategori anggaran, transaksi keuangan, undangan anggota, serta logo grup.

UI dan validasi aplikasi dipertahankan sejauh memungkinkan. Jalur utama autentikasi, query domain, dan penyimpanan logo sudah dialihkan ke MySQL/server-side. Audit sisa file/dependensi Supabase dan pengujian fitur menyeluruh masih berlangsung.

## Struktur penting

- `docker-compose.yml`: orkestrasi service.
- `database/init/`: skrip inisialisasi MySQL untuk volume baru.
- `database/migrations/`: perubahan schema yang perlu diterapkan secara eksplisit, termasuk `001_mini_event_management_mysql.sql`.
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

Schema domain MySQL untuk migrasi aplikasi tersedia di `database/migrations/001_mini_event_management_mysql.sql` dan juga menjadi skrip init untuk volume baru. File init lama yang membuat tabel demo dengan ID numerik telah dihapus agar tidak mendahului schema domain. Build aplikasi dan validasi Compose telah lulus CI, tetapi schema serta alur migrasi data masih perlu diverifikasi pada MySQL 8.4 lokal. Volume lama tidak akan berubah otomatis.

### Upgrade volume lama yang masih memakai tabel demo

Jangan jalankan langkah ini sebelum backup database berhasil dibuat dan diverifikasi. Untuk volume yang masih memiliki tabel `events` numerik lama:

1. Hentikan sementara akses tulis aplikasi (jangan hapus volume).
2. Buat backup database dengan `mysqldump` dan pastikan file backup tersimpan.
3. Rename tabel lama: `RENAME TABLE events TO events_legacy;`.
4. Terapkan `database/migrations/001_mini_event_management_mysql.sql` pada database yang sama.
5. Jalankan Next.js, buat akun Owner dan grup melalui onboarding.
6. Isi `PHP_DEFAULT_GROUP_ID` dengan ID grup tersebut.
7. Edit placeholder `PASTE_OWNER_GROUP_UUID_HERE` pada `database/migrations/003_import_legacy_demo_events.sql`, lalu jalankan script untuk mengimpor data lama.
8. Periksa tiga hitungan hasil import di akhir script sebelum membuka kembali akses tulis.

Script 003 memakai tabel mapping agar impor yang dijalankan ulang tidak membuat event duplikat. Jangan menghapus tabel `events_legacy` atau mapping sampai hasil migrasi diverifikasi. Instruksi ini belum diuji pada volume lokal; jangan eksekusi dulu.

## Status dan rencana

1. Selesaikan audit sisa referensi/file Supabase dan konsistensi dokumentasi.
2. Selesaikan review keamanan route, session, dan pembatasan data per grup.
3. Jalankan pengujian end-to-end pada Docker lokal tanpa menghapus volume.
4. Verifikasi persistensi dan alur event PHP ↔ Next.js.
5. Lengkapi dokumentasi serta bukti demo.

Lihat `PROJECT_PROGRESS_LOG.md` dan `PROJECT_CONTEXT_DOCKER_SHARED_MYSQL.md` untuk catatan detail.
