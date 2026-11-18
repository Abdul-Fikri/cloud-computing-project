# PROJECT CONTEXT — Docker Multi-Application + Shared MySQL

> Dokumen konteks utama untuk sesi belajar tugas Cloud Computing.
> Pemilik proyek menulis dan mengubah seluruh source code aplikasi, konfigurasi, menjalankan perintah, dan mengelola implementasi. Asisten berperan sebagai instruktur. **Pengecualian yang diizinkan:** asisten boleh memperbarui dokumentasi proyek secara langsung pada branch `main`, termasuk melakukan commit dokumentasi, atas permintaan/izin eksplisit pemilik. Izin ini hanya untuk file dokumentasi; bukan source code, konfigurasi aplikasi/Docker, atau perubahan implementasi lainnya.

**Tanggal konteks:** 18 November 2026  
**Repository tugas:** https://github.com/Abdul-Fikri/cloud-computing-project  
**Repository aplikasi referensi:** https://github.com/Abdul-Fikri/mini-event-management

---

## 1. Tujuan Tugas

Membangun dan menjalankan **2 container aplikasi dengan bahasa pemrograman berbeda** serta **1 container database MySQL**. Kedua aplikasi wajib memakai instance/container MySQL yang sama.

Persyaratan pokok:
1. Ada dua aplikasi web yang benar-benar berjalan.
2. Masing-masing aplikasi menggunakan bahasa pemrograman berbeda.
3. Hanya ada satu service/container database MySQL.
4. Kedua aplikasi terkoneksi ke database MySQL yang sama.
5. Semua service berjalan bersama menggunakan Docker Compose.
6. Data MySQL tetap tersimpan saat container dihentikan/dibuat ulang melalui named volume.
7. Kedua aplikasi menunjukkan bahwa mereka membaca dan/atau menulis data pada database yang sama. Buktikan dengan membuat data dari Aplikasi 1 lalu melihatnya dari Aplikasi 2, dan sebaliknya.

## 2. Pembagian Aplikasi

### Aplikasi 1 — Mini Event Management versi tugas
- Bahasa/framework: JavaScript dengan Next.js (mengacu aplikasi sumber).
- Referensi: https://github.com/Abdul-Fikri/mini-event-management
- Fungsi: aplikasi pengelolaan event sederhana sebagai frontend utama.
- Untuk tugas ini, implementasikan **versi pembelajaran/minimal** dan sambungkan ke MySQL. Jangan menganggap source asli Supabase dapat langsung menggunakan MySQL.

### Aplikasi 2 — Aplikasi PHP
- Bahasa: PHP.
- Framework: mulai dengan PHP native agar konsep Docker, koneksi database, query, dan HTTP mudah dipahami. Jangan menambahkan Laravel kecuali pemilik meminta.
- Fungsi: aplikasi pendamping sederhana yang menampilkan dan mengelola sebagian data event yang sama dengan Aplikasi 1.
- Gunakan PHP PDO dengan prepared statements untuk query MySQL.

**Alasan pemilihan PHP:** repository tugas sudah memiliki contoh latihan PHP, Dockerfile PHP-FPM, Nginx, dan Docker Compose. PHP native memungkinkan latihan berfokus pada hubungan antarkontainer dan database bersama, bukan kompleksitas framework.

## 3. Referensi Aplikasi Mini Event Management

Repository referensi telah diperiksa. Stack aktual:
- Next.js 16.4.5 App Router
- React 19.3.0
- JavaScript
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, Storage
- Supabase JS Client dan `@supabase/ssr`
- Zod 4
- lucide-react

Struktur penting pada aplikasi sumber:
- `src/app/`: route dan layout App Router.
- `src/actions/`: Server Actions.
- `src/components/`: UI.
- `src/lib/`: helper, autentikasi, Supabase client, validator.
- `src/proxy.js`: konvensi Proxy Next.js 16.
- `supabase/schema.sql`: skema awal PostgreSQL.
- `supabase/migrations/`: migrasi SQL tambahan.
- `docs/PROJECT_HANDBOOK.md`: penjelasan domain dan alur aplikasi.

Domain data inti yang relevan:
- `groups`: grup/organisasi.
- `members`: direktori orang.
- `events`: acara milik grup.
- `event_members`: anggota yang ditugaskan ke acara.
- Data operasional lain mencakup rundown, tugas, pengadaan, kategori anggaran, dan transaksi.

**Peringatan kompatibilitas:** aplikasi asli menggunakan Supabase/PostgreSQL dan Supabase Auth/Storage. Tugas ini meminta MySQL. Jangan mengklaim aplikasi asli telah berjalan terhadap MySQL sebelum lapisan backend dan skemanya benar-benar disesuaikan. Jangan mengubah repo sumber `mini-event-management`; buat implementasi tugas tersendiri di repo `cloud-computing-project`. Jangan menyalin seluruh sistem Supabase lalu berharap query-nya kompatibel dengan MySQL.

Untuk ruang lingkup tugas, buat MVP yang mempertahankan ide utama aplikasi: daftar event dan CRUD event dasar. Mulai dari autentikasi penuh dan modul kompleks hanya bila memang diminta rubrik.

## 4. Struktur Repository Tugas Saat Ini

Pemeriksaan branch `main` menunjukkan repository berisi dua folder latihan:
- `mini-event-management/`
- `praktek-docker/`

Keduanya saat diperiksa berisi salinan struktur latihan Docker lama yang memakai PHP, Nginx, dan MariaDB. Keduanya bukan implementasi tugas dua aplikasi berbeda bahasa + satu MySQL bersama.

File yang ditemukan pada pola latihan lama:
- `README.md`
- `docker-compose.yaml`
- `build/nginx/nginx.conf`
- `build/nginx/conf.d/localapp.conf`
- `build/php/Dockerfile`
- `build/php/php.ini`
- `htdocs/index.php`

Konfigurasi lama memakai `mariadb:latest`, bukan MySQL, serta mendefinisikan service PHP, Nginx, database, dan phpMyAdmin. Ada dua direktori latihan yang tampak memiliki salinan file yang sama. Jangan menghapus, memindahkan, atau menimpa folder latihan tersebut sebelum pemilik memutuskan.

Saat memulai implementasi tugas baru, usulkan satu folder baru khusus, misalnya:
```text
cloud-computing-project/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── database/
│   └── init/
│       └── 001_create_tables.sql
├── app-next/
│   ├── Dockerfile
│   ├── package.json
│   └── ...
└── app-php/
    ├── Dockerfile
    ├── public/
    │   └── index.php
    └── ...
```
Ini adalah **struktur yang diusulkan**, bukan struktur yang sudah ada. Periksa ulang tree lokal sebelum menentukan nama akhir atau membuat file.

## 5. Arsitektur Container yang Dituju

Tiga service inti:

| Service | Bahasa/teknologi | Tanggung jawab |
|---|---|---|
| `app-next` | JavaScript / Next.js | Aplikasi web 1 |
| `app-php` | PHP | Aplikasi web 2 |
| `mysql` | MySQL | Satu database bersama |

Ketentuan jaringan:
- Ketiga service berada pada satu Docker network yang sama.
- Kedua aplikasi menggunakan hostname service database yaitu `mysql`, bukan `localhost`.
- Port internal MySQL adalah `3306`.
- Dari dalam container aplikasi, host database = `mysql`, port = `3306`.
- Port host untuk membuka MySQL dari laptop bersifat opsional; jangan mengekspos database ke publik.
- Aplikasi 1 dan Aplikasi 2 masing-masing memiliki port host berbeda, misalnya Next.js `3000` dan PHP/Nginx `8080`.
- Jangan membuat service MySQL kedua.
- Jangan menghubungkan aplikasi ke IP container yang berubah-ubah; gunakan DNS service Compose.
- Gunakan `depends_on` dengan health check/condition yang tepat agar aplikasi menunggu MySQL siap, bukan hanya menunggu container dibuat.

Penyimpanan:
- Gunakan named volume, misalnya `mysql_data`, untuk direktori data MySQL yang benar sesuai image resmi.
- Jangan menghapus volume saat latihan kecuali pemilik memang ingin menghapus seluruh data.
- `docker compose down` normal tidak menghapus named volume. `docker compose down -v` menghapus volume dan harus diberi peringatan karena data hilang.

Environment:
- Simpan konfigurasi lokal dalam `.env` yang di-ignore Git.
- Sediakan `.env.example` tanpa password nyata.
- Jangan commit password database atau secret.
- Database, user, dan password harus konsisten di kedua aplikasi.
- Aplikasi menggunakan akun database terbatas (bukan root) untuk operasi normal.

## 6. Model Database Awal yang Direkomendasikan

Untuk memastikan dua aplikasi dapat berbagi data dengan jelas, mulai dari satu tabel domain yang sederhana:

`events`:
- `id` — primary key.
- `name` — nama event, wajib.
- `description` — deskripsi opsional.
- `event_date` — tanggal event.
- `location` — lokasi opsional.
- `created_at` — waktu dibuat.
- `updated_at` — waktu diperbarui.

Opsional nanti: tabel `members` atau `event_members` bila kebutuhan tugas menuntut demonstrasi relasi. Jangan memperluas schema sebelum alur CRUD dasar pada kedua aplikasi berfungsi.

Prinsip:
- Gunakan tipe data MySQL yang tepat.
- Tambahkan `NOT NULL`, index, dan constraint seperlunya.
- Kedua aplikasi membaca/menulis tabel yang sama.
- Jangan menghubungkan tiap aplikasi ke database/schema yang berbeda.
- Inisialisasi database dengan SQL yang diletakkan pada folder init yang di-mount ke entrypoint resmi MySQL, bila pendekatan tersebut dipilih.
- Ketahui bahwa skrip init image MySQL umumnya berjalan saat direktori data masih kosong; mengubah SQL init tidak otomatis mengubah database volume yang sudah terinisialisasi.

## 7. Aturan Kode Aplikasi

### Next.js
- Pertahankan JavaScript, bukan TypeScript, kecuali pemilik meminta.
- Gunakan App Router sesuai pola Next.js.
- Koneksi MySQL dari server-side code saja; jangan pernah mengirim kredensial database ke browser.
- Gunakan package driver MySQL yang sesuai (contoh: `mysql2`) setelah menjelaskan kegunaannya.
- Simpan konfigurasi DB dalam environment variables.
- Server Components/Server Actions/Route Handlers dapat dipilih sesuai kebutuhan, tetapi setiap akses DB harus terjadi di server.
- Jangan mengimpor modul koneksi database ke Client Component.
- Jangan gunakan konfigurasi Supabase/PostgreSQL dari repo asli untuk tugas MySQL.

### PHP
- Gunakan PHP PDO.
- Buat koneksi terpusat (misalnya `src/db.php` atau `config/database.php`, sesuai struktur yang dipilih).
- Baca host, port, database, user, dan password dari environment.
- Gunakan prepared statements.
- Escape output HTML untuk menghindari XSS.
- Jangan memasukkan password langsung di source.

## 8. Aturan Docker

- Gunakan Docker Compose sebagai entry point untuk menjalankan tiga service.
- Gunakan Dockerfile terpisah untuk tiap aplikasi.
- Database menggunakan image MySQL resmi dan versi/tag yang ditetapkan secara eksplisit; jangan gunakan `latest` untuk hasil yang harus reproducible.
- Utamakan image minimal dan build yang mudah dipahami.
- Nginx hanya diperlukan untuk PHP bila memakai PHP-FPM; jika digunakan, jelaskan bahwa Nginx adalah web server/reverse proxy pendamping dan bukan container aplikasi tambahan yang mengubah jumlah komponen tugas secara substansi. Untuk tugas yang benar-benar membatasi jumlah container tepat tiga, gunakan image PHP Apache atau pendekatan satu container PHP web server agar jumlahnya tetap tiga.
- Pastikan setiap aplikasi memiliki port host sendiri.
- Tambahkan healthcheck pada MySQL.
- Jangan gunakan `container_name` kecuali ada alasan pembelajaran yang jelas; service name sudah menjadi hostname jaringan.
- Gunakan named volume untuk data MySQL.
- Hindari memublikasikan port DB ke semua interface tanpa kebutuhan.
- Selalu jelaskan perbedaan port host dan container.
- Jangan memakai container berjalan sebagai pengganti file source; source tetap berada di repository dan di-build/mount sesuai mode development/production.

## 9. Definisi Selesai / Acceptance Criteria

Tugas dinyatakan selesai hanya jika semua kondisi ini dibuktikan:

1. `docker compose config` valid.
2. `docker compose up --build` berhasil membangun dan menjalankan ketiga service.
3. `docker compose ps` menunjukkan dua aplikasi dan satu MySQL sehat/berjalan.
4. Aplikasi Next.js dapat dibuka melalui port host yang ditentukan.
5. Aplikasi PHP dapat dibuka melalui port host yang ditentukan.
6. Kedua aplikasi terkoneksi ke service `mysql` pada network Compose.
7. Aplikasi 1 membuat satu event; Aplikasi 2 dapat melihat event yang sama.
8. Aplikasi 2 membuat/mengubah satu event; Aplikasi 1 dapat melihat perubahan tersebut.
9. Data tetap ada setelah aplikasi/container dihentikan dan dijalankan kembali.
10. Hanya satu container/service MySQL yang digunakan bersama.
11. Password/secret tidak berada dalam repository.
12. Pemilik mampu menjelaskan Dockerfile, image, container, network, volume, port mapping, environment variable, dan shared database.

Bukti demonstrasi paling penting adalah **data yang sama terlihat dari dua aplikasi**, bukan sekadar kedua halaman berhasil dibuka.

## 10. Metode Belajar — Instruksi, Bukan Pengerjaan Otomatis

Ini adalah batasan utama interaksi:

- Pemilik sendiri yang mengedit seluruh source code aplikasi dan konfigurasi, membuat struktur implementasi, menjalankan perintah, dan melakukan commit implementasi.
- **Asisten diizinkan memperbarui file dokumentasi proyek secara langsung pada branch `main` dan membuat commit dokumentasi.** Izin ini hanya berlaku untuk dokumentasi (misalnya file konteks, progres, catatan keputusan, atau README dokumentasi) dan tidak memberi izin mengubah source code, Dockerfile, Compose, konfigurasi aplikasi, atau implementasi.
- Asisten bertindak sebagai instruktur/mentor untuk implementasi.
- Berikan instruksi bertahap: satu milestone kecil, lalu tunggu hasil/error dari pemilik sebelum melanjutkan.
- Untuk setiap langkah implementasi, sebutkan:
  1. Tujuan langkah.
  2. Lokasi folder/file yang harus dibuat atau dibuka.
  3. Kode lengkap atau bagian kode yang perlu diketik.
  4. Penjelasan fungsi setiap bagian penting.
  5. Perintah yang perlu dijalankan (utamakan Windows PowerShell bila relevan).
  6. Output yang diharapkan.
  7. Cara verifikasi dan arti error umum.
- Jangan memberikan seluruh aplikasi sekaligus. Fokus pada satu konsep tiap tahap.
- Jangan menyembunyikan alasan desain. Jelaskan kenapa dua aplikasi bisa mencapai database yang sama melalui service hostname dan shared network.
- Jangan menganggap pemilik sudah paham Docker, MySQL, PHP, atau Next.js containerization; bangun pemahaman dari konsep ke praktik.
- Hindari pertanyaan klarifikasi berulang untuk hal yang sudah ada di dokumen ini. Ambil default yang aman dan tandai asumsi.
- Jangan klaim perintah/test berhasil sebelum pemilik membagikan hasilnya atau ada bukti tool yang benar-benar menjalankan test.
- Jangan minta secret/password dikirim ke chat. Gunakan placeholder dalam contoh.

## 11. Urutan Pembelajaran

Tahap 0 — Memahami rancangan:
- Memahami perbedaan image dan container.
- Memahami service pada Compose.
- Memahami network internal dan DNS service.
- Memahami named volume dan persistensi database.
- Memahami port host vs port container.
- Memahami kenapa kedua aplikasi menggunakan satu hostname database.

Tahap 1 — Menyiapkan ruang kerja:
- Menentukan folder proyek baru di repository tugas.
- Membuat struktur dasar untuk dua aplikasi dan database.
- Menyiapkan `.gitignore` dan `.env.example`.
- Belum perlu membuat fitur aplikasi.

Tahap 2 — Menjalankan MySQL:
- Menentukan image/tag.
- Menulis konfigurasi service MySQL.
- Menambahkan named volume dan healthcheck.
- Menambahkan schema/table awal.
- Verifikasi koneksi dan persistensi.

Tahap 3 — Aplikasi PHP:
- Membuat Dockerfile/aplikasi PHP sederhana.
- Membuat koneksi PDO ke hostname `mysql`.
- Membuat tampilan baca dan tambah data.
- Verifikasi CRUD dan data tersimpan di MySQL.

Tahap 4 — Aplikasi Next.js:
- Menyiapkan aplikasi Next.js tugas terpisah.
- Membuat koneksi server-side dengan driver MySQL.
- Membuat UI baca/tambah/edit/hapus event minimal.
- Verifikasi data yang dibuat PHP terlihat di Next.js.

Tahap 5 — Integrasi dan pengujian:
- Satukan tiga service dalam Compose.
- Pastikan kedua app berbagi network dan database.
- Buktikan pertukaran data dua arah.
- Uji restart dan volume persistence.
- Periksa log, healthcheck, dan konfigurasi Compose.

Tahap 6 — Dokumentasi/demo:
- Lengkapi README dengan arsitektur, perintah, port, dan screenshot/bukti.
- Siapkan diagram arsitektur.
- Siapkan skenario demo yang menunjukkan satu database dipakai dua aplikasi berbeda bahasa.

Urutan dapat disesuaikan jika kondisi file aktual berbeda, tetapi acceptance criteria tidak boleh dikurangi tanpa persetujuan pemilik.

## 12. Batasan dan Hal yang Belum Diputuskan

- Bahasa kedua ditetapkan sebagai PHP native sebagai default pembelajaran. Ubah hanya bila dosen/rubrik menentukan bahasa lain.
- Belum ada spesifikasi detail tugas/rubrik dosen di repository yang dapat diperiksa. Jangan mengarang requirement tambahan.
- Versi final image MySQL, PHP, Node, dan base image harus dipilih dan dijelaskan sebelum Dockerfile final dibuat.
- Pilihan apakah PHP berjalan melalui Apache atau PHP-FPM + Nginx perlu diputuskan dengan mempertimbangkan batas jumlah container. Default untuk menjaga tepat tiga container adalah PHP Apache.
- Nama database, user database, dan kredensial lokal belum ditetapkan. Gunakan placeholder dan environment variable.
- Ruang lingkup fitur MVP aplikasi adalah CRUD event minimal yang memakai tabel bersama.
- Jangan menganggap Supabase pada aplikasi sumber bisa dipakai sebagai database tugas ini. MySQL adalah target terpisah.

## 13. Instruksi Awal Saat Konteks Dibaca

Mulai dengan:
1. Sampaikan arsitektur tiga-container dan aliran data dua aplikasi ke satu MySQL.
2. Jelaskan secara singkat perbedaan stack aplikasi sumber (Next.js + Supabase/PostgreSQL) dan target tugas (Next.js + MySQL, ditambah PHP + MySQL).
3. Tunjukkan struktur folder target yang diusulkan.
4. Mulai Tahap 0/Tahap 1 dengan instruksi kecil dan satu file/folder pada satu waktu.
5. Jangan mengedit source code atau konfigurasi implementasi secara langsung. Pemilik mengetik dan mengubah semuanya sendiri. Asisten boleh mengelola dokumentasi di `main` sesuai izin khusus pada Bagian 10.

---

## 14. Catatan Progres Implementasi — 18 November 2026

### 14.1 Pemeriksaan lingkungan pengembangan

Pemeriksaan awal dilakukan pada komputer pemilik proyek melalui Command Prompt.

| Komponen | Versi / Hasil |
|---|---|
| Docker Engine | 29.9.3 |
| Docker Compose | v5.7.0 |
| Git | 2.51.2.windows.1 |
| Node.js | v22.12.0 |
| npm | 10.9.0 |
| Docker Context | desktop-linux |
| Docker OS | Docker Desktop, Linux |
| Kernel | WSL2 |
| Arsitektur | x86_64 |
| CPU Docker | 8 |
| RAM Docker | 3.674 GiB |

**Status:** Docker Client dan Docker Server berhasil diakses melalui `docker info`. Docker Engine aktif.

Catatan resource:
- Docker melaporkan 6 container yang sudah ada.
- 4 container berstatus running.
- 2 container berstatus stopped.
- Container yang sudah ada tidak boleh dihentikan atau dihapus sembarangan karena mungkin digunakan untuk latihan lain.

### 14.2 Verifikasi repository

Direktori kerja lokal:

`C:\cloud-computing-1`

Git remote:
- `origin`: `https://github.com/Abdul-Fikri/cloud-computing-project.git`

Branch:
- `main`
- Tracking: `origin/main`

Hasil `git status --short --branch`:

`## main...origin/main`

Artinya working tree bersih pada saat pemeriksaan.

### 14.3 Struktur direktori lokal yang terverifikasi

```text
cloud-computing-1/
├── mini-event-management/
│   ├── build/
│   │   ├── nginx/
│   │   │   ├── nginx.conf
│   │   │   └── conf.d/
│   │   │       └── localapp.conf
│   │   └── php/
│   │       ├── Dockerfile
│   │       └── php.ini
│   ├── htdocs/
│   │   ├── index.php
│   │   └── html/
│   │       └── error_log
│   ├── docker-compose.yaml
│   └── README.md
│
├── praktek-docker/
│   ├── build/
│   │   ├── nginx/
│   │   │   ├── nginx.conf
│   │   │   └── conf.d/
│   │   │       └── localapp.conf
│   │   └── php/
│   │       ├── Dockerfile
│   │       └── php.ini
│   ├── htdocs/
│   │   ├── index.php
│   │   └── html/
│   │       └── error_log
│   ├── docker-compose.yaml
│   └── README.md
│
└── PROJECT_CONTEXT_DOCKER_SHARED_MYSQL.md
```

Kedua folder latihan memiliki struktur dan nama file yang identik berdasarkan output `tree [folder] /F` dari komputer pemilik pada 18 November 2026.

**Analisis sementara:**
- Kedua folder merupakan latihan dengan pola PHP dan Nginx.
- Isi konfigurasi belum diperiksa pada saat catatan ini dibuat.
- Keberadaan file dan struktur direktori tidak cukup untuk memastikan versi PHP, image database, atau konfigurasi runtime.
- Jangan menyimpulkan konfigurasi aktual sebelum membaca isi file.

Kedua folder latihan lama masih tersedia dan tidak boleh ditimpa, dihapus, atau diubah tanpa keputusan pemilik proyek.

### 14.4 Status pembelajaran

| Tahap | Status |
|---|---|
| Tahap 0 — Memahami rancangan | Selesai secara konseptual |
| Tahap 1 — Menyiapkan ruang kerja | Pemeriksaan lingkungan dan struktur awal selesai; folder proyek baru belum dibuat |
| Tahap 2 — Menjalankan MySQL | Belum dimulai |
| Tahap 3 — Aplikasi PHP | Belum dimulai |
| Tahap 4 — Aplikasi Next.js | Belum dimulai |
| Tahap 5 — Integrasi dan pengujian | Belum dimulai |
| Tahap 6 — Dokumentasi dan demo | Belum dimulai |

### 14.5 Keputusan dan catatan lanjutan

1. Repository lokal yang digunakan sudah terverifikasi.
2. Docker Engine sudah aktif.
3. Proyek baru akan dibuat pada folder terpisah agar tidak mengganggu latihan lama.
4. Nama dan struktur folder proyek baru belum ditetapkan.
5. Belum ada file aplikasi atau konfigurasi Compose baru yang dibuat pada tahap ini.
6. Semua hasil perintah dan keputusan teknis berikutnya harus dicatat dalam dokumentasi progres.
7. Pemilik proyek tetap melakukan seluruh perubahan source code, konfigurasi implementasi, menjalankan perintah, dan commit implementasi secara mandiri.
8. Asisten boleh melakukan perubahan dan commit langsung untuk file dokumentasi di branch `main`, sesuai izin eksplisit pemilik.

### 14.6 Titik terakhir pembelajaran

Pemeriksaan struktur folder selesai. Langkah berikutnya adalah membaca isi konfigurasi latihan lama untuk memahami pola PHP + Nginx yang sudah pernah digunakan.

File yang akan diperiksa:
- `mini-event-management/docker-compose.yaml`
- `mini-event-management/build/php/Dockerfile`
- `mini-event-management/htdocs/index.php`

Hasil pemeriksaan isi file tersebut belum tersedia dan belum boleh diasumsikan.


## 15. Keputusan Struktur Workspace — 19 November 2026

Pemilik mengklarifikasi bahwa `C:\\cloud-computing-1` merupakan folder induk proyek yang memang menjadi root repository. Folder `mini-event-management/` dan `praktek-docker/` adalah dua folder proyek/latihan container yang sudah ada dan harus tetap berada di root tersebut. Folder untuk konfigurasi/inisialisasi database bersama akan ditambahkan langsung di root sebagai `database/` (dengan subfolder `init/` untuk SQL schema). File `docker-compose.yml` untuk orkestrasi tiga service juga ditempatkan di root agar seluruh komponen tidak tersebar ke folder induk baru.

Struktur target yang disepakati secara konseptual:

```text
C:\\cloud-computing-1\\
├── mini-event-management\\   # dipertahankan
├── praktek-docker\\           # dipertahankan
├── database\\                 # folder baru untuk MySQL init/schema
│   └── init\\
├── docker-compose.yml         # konfigurasi orkestrasi di root
├── .env.example
├── .gitignore
├── README.md
├── PROJECT_CONTEXT_DOCKER_SHARED_MYSQL.md
└── PROJECT_PROGRESS_LOG.md
```

Catatan: struktur di atas adalah target konseptual; folder/file baru belum dibuat. Penempatan Dockerfile dan source aplikasi akan mengikuti pemeriksaan isi aktual kedua folder serta keputusan implementasi berikutnya. Tidak ada folder yang dipindahkan, dihapus, atau diubah pada keputusan ini.


## 16. Penetapan Peran Dua Folder Aplikasi — 19 November 2026

Pemilik menetapkan peran folder yang sudah tersedia untuk implementasi tugas:
- `mini-event-management/` akan menjadi aplikasi 1 berbasis Next.js/JavaScript. Folder ini sebelumnya disalin dari `praktek-docker/`, sehingga isinya saat ini masih berupa latihan PHP. Isi PHP lama perlu ditangani secara hati-hati saat tahap migrasi; jangan menghapus atau menimpa sebelum inventarisasi dan persetujuan langkahnya.
- `praktek-docker/` akan menjadi aplikasi 2 berbasis PHP dan dipertahankan sebagai aplikasi PHP.
- `database/` di root akan menampung SQL inisialisasi/schema MySQL bersama.
- `docker-compose.yml` di root akan mengorkestrasi service Next.js, PHP, dan satu MySQL.

Pemilik juga menyediakan repository `mini-event-management` sebagai referensi aplikasi/domain Next.js. Repository referensi tersebut berbeda dari folder lokal `mini-event-management/` di workspace tugas; jangan menganggap folder lokal sudah berisi source Next.js hanya karena namanya sama.

Ini adalah keputusan peran target, bukan klaim bahwa folder lokal sudah dimigrasikan. Sebelum perubahan implementasi, lakukan inventarisasi isi folder dan pastikan tidak ada file latihan yang perlu dipertahankan.


## 17. Pembaruan Batas Izin Bantuan Implementasi — 19 November 2026

Pemilik memperluas izin bantuan secara eksplisit: asisten boleh mengerjakan/mengubah **source code aplikasi web Next.js saja** di folder `mini-event-management/` (misalnya halaman, komponen, dan logika aplikasi). Asisten tetap tidak boleh mengubah konfigurasi implementasi yang menjadi tanggung jawab pemilik, termasuk Docker Compose, Dockerfile, `.env`, konfigurasi MySQL/container/network/volume, serta konfigurasi aplikasi lainnya. Folder `praktek-docker/` juga tetap dikelola pemilik kecuali ada izin baru.

Pembagian kerja:
- Asisten: source code web Next.js pada `mini-event-management/`.
- Pemilik: konfigurasi Docker dan container, MySQL, environment, serta implementasi PHP pada `praktek-docker/`.
- Integrasi dan pengujian dilakukan bersama dengan instruksi bertahap.

Batas akses teknis: workspace lokal Windows `C:\\cloud-computing-1` tidak tersedia langsung untuk diedit dari sesi ini. Scaffold Next.js yang baru dibuat pemilik masih berada di komputer lokal dan belum terbukti sudah di-push ke repository GitHub. Agar asisten dapat mengedit source code tersebut tanpa menimpa konfigurasi atau scaffold lokal, pemilik perlu mengirimkan scaffold terbaru ke branch repository terlebih dahulu (atau menyediakan file source yang relevan). Asisten tidak boleh mengklaim telah mengedit file lokal yang tidak dapat diakses.
