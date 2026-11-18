# PROJECT PROGRESS LOG — Docker Multi-Application + Shared MySQL

Dokumen ini mencatat hasil pemeriksaan dan progres praktik secara kronologis. Dokumen konteks utama berada di [PROJECT_CONTEXT_DOCKER_SHARED_MYSQL.md](./PROJECT_CONTEXT_DOCKER_SHARED_MYSQL.md).

## 18 November 2026 — Pemeriksaan lingkungan dan latihan Docker lama

### 1. Lingkungan pengembangan

| Komponen | Hasil |
|---|---|
| Docker Engine | 29.9.3 |
| Docker Compose | v5.7.0 |
| Git | 2.51.2.windows.1 |
| Node.js | v22.12.0 |
| npm | 10.9.0 |
| Docker context | desktop-linux |
| Docker OS | Docker Desktop Linux melalui WSL2 |
| CPU Docker | 8 |
| RAM Docker | 3.674 GiB |

Docker Client dan Server berhasil diakses melalui `docker info`. Saat pemeriksaan, Docker melaporkan 6 container (4 running, 2 stopped). Jangan menghentikan atau menghapus container yang sudah ada tanpa memeriksa kegunaannya.

### 2. Repository dan direktori lokal

Direktori kerja: `C:\\cloud-computing-1`

Remote Git:
- `origin https://github.com/Abdul-Fikri/cloud-computing-project.git`

Branch: `main`, tracking `origin/main`. Hasil `git status --short --branch` adalah `## main...origin/main`, sehingga working tree bersih saat diperiksa.

Dua folder latihan yang ada:
- `mini-event-management/`
- `praktek-docker/`

Keduanya memiliki struktur identik:
```text
folder-latihan/
├── docker-compose.yaml
├── README.md
├── build/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/localapp.conf
│   └── php/
│       ├── Dockerfile
│       └── php.ini
└── htdocs/
    ├── index.php
    └── html/error_log
```

Folder latihan tersebut adalah aset latihan yang sudah ada. Jangan ditimpa, dihapus, atau diubah untuk proyek tugas baru tanpa keputusan pemilik.

### 3. Isi konfigurasi yang benar-benar diperiksa

Pemilik menjalankan perintah `type` dan membagikan isi file berikut dari folder `mini-event-management`:

#### 3.1 `mini-event-management/docker-compose.yaml`

Temuan dari isi file:
- Mendefinisikan named volume `proyek1db`.
- Mendefinisikan network `proyek1app`.
- Mendefinisikan empat service: `nginx`, `php`, `db`, dan `phpmyadmin`.
- Service `nginx` memakai image `nginx:alpine`.
- Nginx memetakan folder `./htdocs` ke `/var/www`, konfigurasi Nginx ke `/etc/nginx/conf.d`, dan file konfigurasi utama ke `/etc/nginx/nginx.conf`.
- Port host Nginx: `8001:80` dan `443:443`.
- Nginx memiliki `depends_on: php` dan bergabung ke network `proyek1app`.
- Service `php` dibangun dari `./build/php`, memetakan folder web yang sama, dan memetakan `php.ini`.
- Service `php` bergabung ke network `proyek1app`.
- Service `db` memakai image `mariadb:latest`, bukan image MySQL.
- Environment database yang tertulis: `MARIADB_ROOT_PASSWORD: root`, `MARIADB_PASSWORD: secret`, dan `MARIADB_USER: homestead`. File yang diperiksa tidak menunjukkan variabel nama database.
- Port database dipetakan `3307:3306`.
- Volume database dipetakan sebagai `proyek1db:/var/lib/mariadb`.
- Service `phpmyadmin` memakai image `phpmyadmin/phpmyadmin`, memublikasikan port `8081:80`, dan bergabung ke network `proyek1app`.

Catatan analisis:
- Ini merupakan stack latihan PHP-FPM + Nginx dengan MariaDB dan phpMyAdmin.
- Terdapat empat service/container yang didefinisikan, bukan arsitektur target tiga service.
- Database-nya MariaDB, sedangkan tugas baru mensyaratkan MySQL.
- Nilai password yang terlihat di file adalah kredensial contoh/latihan. Jangan menyalinnya ke proyek baru; gunakan environment file lokal dan jangan commit secret.
- Belum ada verifikasi runtime dari Compose lama pada sesi ini. Catatan ini hanya mendokumentasikan isi file yang dibagikan.
- Mount volume data MariaDB pada `/var/lib/mariadb` perlu diverifikasi terhadap lokasi data yang digunakan image yang dipilih sebelum dijadikan referensi. Jangan menganggapnya benar hanya dari nama volume.

#### 3.2 `mini-event-management/build/php/Dockerfile`

Isi:
```dockerfile
FROM php:7.4-fpm
RUN docker-php-ext-install mysqli
```

Makna:
- Base image adalah PHP 7.4 dengan PHP-FPM.
- Image memasang ekstensi PHP `mysqli`.
- Dockerfile ini belum memasang ekstensi PDO MySQL.
- Versi PHP 7.4 merupakan versi yang digunakan latihan lama; jangan otomatis menggunakannya untuk proyek baru. Versi runtime proyek baru akan dipilih secara sadar dan dijelaskan.

#### 3.3 `mini-event-management/htdocs/index.php`

Isi:
```php
<?php echo phpinfo(); ?>
```

Makna:
- Halaman hanya memanggil `phpinfo()` untuk menampilkan informasi konfigurasi PHP.
- Belum ada logika aplikasi, query database, atau koneksi database pada file ini.

### 4. Kesimpulan pembelajaran dari latihan lama

Latihan lama memperlihatkan pembagian tanggung jawab:
- Nginx menerima HTTP request sebagai web server.
- PHP-FPM menjalankan kode PHP.
- MariaDB menjadi database.
- phpMyAdmin menyediakan antarmuka administrasi database.

Untuk tugas baru, target tetap dua aplikasi berbeda bahasa (Next.js/JavaScript dan PHP) serta satu MySQL bersama. Agar jumlah service inti tepat tiga, pendekatan PHP Apache satu container akan dipertimbangkan dibanding pola PHP-FPM + Nginx yang memerlukan dua container untuk aplikasi PHP. Keputusan final dibuat sebelum implementasi.

### 5. Status dan langkah berikutnya

| Tahap | Status |
|---|---|
| Tahap 0 — Konsep arsitektur | Selesai secara konseptual |
| Tahap 1 — Menyiapkan ruang kerja | Pemeriksaan lingkungan, struktur, dan sebagian konfigurasi latihan selesai; folder proyek baru belum dibuat |
| Tahap 2 — MySQL | Belum dimulai |
| Tahap 3 — PHP | Belum dimulai |
| Tahap 4 — Next.js | Belum dimulai |
| Tahap 5 — Integrasi | Belum dimulai |
| Tahap 6 — Dokumentasi/demo | Berjalan paralel melalui progress log |

Pemeriksaan berikutnya yang masih diperlukan:
1. Baca `mini-event-management/build/nginx/nginx.conf`.
2. Baca `mini-event-management/build/nginx/conf.d/localapp.conf`.
3. Baca `mini-event-management/build/php/php.ini`.
4. Bila perlu, bandingkan file terkait di `praktek-docker`; sejauh ini yang terverifikasi identik hanya struktur dan nama file, belum isi seluruh file.

**Titik terakhir:** isi Compose, Dockerfile PHP, dan index.php dari folder `mini-event-management` telah dibagikan dan dianalisis. Belum ada implementasi proyek baru yang dibuat atau dijalankan.
