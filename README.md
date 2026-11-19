# Mini Event Management — Docker + MySQL

Repository tugas Cloud Computing. Versi target menjalankan aplikasi Mini Event Management (Next.js), aplikasi PHP, dan satu MySQL bersama melalui Docker Compose.

> **Status migrasi:** alur aplikasi Owner/Panitia, fitur domain, autentikasi, dan penyimpanan logo telah dialihkan ke MySQL. Client dan konfigurasi runtime Supabase telah dibersihkan dari source Next.js; sisa direktori `supabase/` hanya menyimpan schema/migration historis dari aplikasi asal. CI sebelumnya lulus, dan validasi untuk perubahan cleanup ini sedang berjalan. Pengujian end-to-end Docker dan verifikasi upgrade volume MySQL lama masih belum dilakukan.

## Target arsitektur
- **Next.js**: aplikasi Mini Event Management utama.
- **PHP**: aplikasi kedua untuk demonstrasi penggunaan database bersama.
- **MySQL**: satu database yang digunakan kedua aplikasi.
- **Docker Compose**: satu network bersama dan named volume untuk persistensi.

## Fitur aplikasi yang menjadi cakupan migrasi
Autentikasi Owner/Panitia, onboarding grup, event, anggota dan susunan panitia, divisi, rundown, tugas, pengadaan, kategori anggaran, transaksi keuangan, undangan anggota, serta logo grup.

## Struktur penting
- `docker-compose.yml`: orkestrasi service.
- `database/init/`: skrip inisialisasi MySQL untuk volume baru.
- `database/migrations/`: migrasi schema dan draft impor data lama.
- `app-php/`: aplikasi PHP.
- `mini-event-management/app-next/`: aplikasi Next.js versi Docker/MySQL.

## Menjalankan Docker
Buat file `.env` lokal dari `.env.example`, lalu jalankan:
```bash
docker compose config
docker compose up --build -d
docker compose ps
```
Jangan menjalankan `docker compose down -v` jika ingin mempertahankan data MySQL.

## Integrasi event PHP ↔ Next.js
Kedua aplikasi menggunakan tabel `events` yang sama. Tentukan grup Owner yang sama melalui `PHP_DEFAULT_GROUP_ID` pada file `.env` lokal. Nilainya adalah ID grup yang dibuat dari onboarding aplikasi Next.js. PHP dan endpoint demo Next.js membatasi operasi event ke grup tersebut.

Endpoint demo PHP/Next.js tidak memiliki autentikasi pengguna. Gunakan hanya untuk demonstrasi lokal; jangan mengeksposnya ke internet publik tanpa menambahkan autentikasi/otorisasi.

## Catatan database
Skrip pada `database/init/` hanya dijalankan otomatis ketika direktori data MySQL masih kosong. Volume lama tidak berubah otomatis. Untuk volume lama, lakukan migrasi terencana setelah backup terverifikasi.

Schema MySQL aplikasi tersedia di `database/migrations/001_mini_event_management_mysql.sql` dan menjadi skrip init volume baru. Draft `003_import_legacy_demo_events.sql` disiapkan untuk mengimpor event lama setelah schema baru dan grup Owner tersedia. Prosedur upgrade belum diuji pada volume lokal; jangan eksekusi sebelum backup dan pemeriksaan manual.

## Status dan rencana
1. Selesaikan audit akhir referensi Supabase dan dokumentasi historis.
2. Pastikan seluruh CI setelah cleanup lulus.
3. Jalankan pengujian end-to-end pada Docker lokal tanpa menghapus volume.
4. Verifikasi persistensi dan alur event PHP ↔ Next.js.
5. Lengkapi bukti demo sebelum merge.
