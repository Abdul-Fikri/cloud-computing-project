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


## 19 November 2026 — Pemeriksaan konfigurasi Nginx dan PHP

Pemilik membagikan isi konfigurasi Nginx dan PHP dari folder `mini-event-management`. Catatan berikut didasarkan pada isi file yang dibagikan, bukan hasil pengujian runtime.

### 6.1 `build/nginx/nginx.conf`

Temuan:
- Worker berjalan sebagai user `nginx`.
- `worker_processes auto`.
- Error log utama diarahkan ke `/var/log/nginx/error.log` dengan level `notice`.
- `worker_connections 1024`.
- Memuat MIME types dari `/etc/nginx/mime.types`.
- Default content type adalah `application/octet-stream`.
- Mengaktifkan access log dengan format `main`.
- `sendfile on`.
- `keepalive_timeout 65000`.
- Mengatur FastCGI buffers: `fastcgi_buffers 8 16k` dan `fastcgi_buffer_size 32k`.
- Memuat konfigurasi virtual host dari `/etc/nginx/conf.d/*.conf`.

Penjelasan:
- File ini merupakan konfigurasi tingkat utama Nginx: worker, logging, HTTP defaults, dan pemuatan konfigurasi server.
- Konfigurasi untuk meneruskan request PHP berada di file virtual host `localapp.conf`, bukan di file utama ini.

### 6.2 `build/nginx/conf.d/localapp.conf`

Temuan:
- Mendefinisikan satu `server` yang listen pada port container `80`.
- `server_name minorigroup.local`.
- Default index: `index.php index.html`.
- Document root: `/var/www`.
- `client_max_body_size 0`, yang menonaktifkan pembatasan ukuran body request dari sisi directive ini.
- Request dengan pola file PHP masuk ke `location ~ \.php$`.
- Memeriksa file dengan `try_files $uri =404`.
- Menggunakan FastCGI dengan `fastcgi_pass php:9000`.
- Mengatur `fastcgi_index index.php`, memuat `fastcgi_params`, dan mengatur timeout baca 900 detik.
- Mengirim `SCRIPT_FILENAME` dan `PATH_INFO` ke PHP-FPM.
- Untuk route umum, `try_files $uri $uri/ /index.php?$query_string` mengarahkan request yang tidak cocok ke front controller `index.php`.
- Ada konfigurasi FastCGI cache yang masih berupa komentar, sehingga tidak aktif.

Alur request yang dapat disimpulkan:
1. Browser mengirim HTTP request ke port host yang dipetakan ke Nginx.
2. Nginx melayani file statis langsung dari document root `/var/www`.
3. Untuk file PHP, Nginx meneruskan request melalui FastCGI ke hostname service Compose `php` pada port internal `9000`.
4. PHP-FPM memproses script dan mengembalikan hasil ke Nginx.
5. Nginx mengirim response HTTP ke browser.

Konsep penting:
- `php:9000` adalah komunikasi antarkontainer melalui DNS service Compose, bukan alamat localhost.
- Port 9000 adalah port FastCGI internal PHP-FPM, bukan port HTTP yang dibuka langsung ke browser.
- Nginx dan PHP-FPM sama-sama memetakan folder source `htdocs` ke path `/var/www`, sehingga lokasi script yang dilihat kedua container konsisten.
- `server_name minorigroup.local` adalah nama host virtual yang diharapkan konfigurasi; belum ada bukti bahwa DNS/hosts lokal sudah disetel atau diuji.

Catatan keamanan/konfigurasi:
- `client_max_body_size 0` membuat Nginx tidak membatasi ukuran body pada directive tersebut. Ini bukan default yang sebaiknya disalin tanpa kebutuhan.
- Timeout 900 detik sangat panjang untuk aplikasi sederhana dan tidak perlu diadopsi otomatis.
- Belum ada bukti bahwa HTTPS aktif. Compose memetakan port host 443, tetapi server block yang dibagikan hanya menunjukkan `listen 80`; konfigurasi TLS tidak terlihat pada file ini.

### 6.3 `build/php/php.ini`

Isi file PHP yang dibagikan mencakup beberapa konfigurasi berikut:
- `post_max_size = 1024M`.
- `upload_max_filesize = 1024M`.
- `file_uploads = On`.
- `max_file_uploads = 200`.
- `allow_url_fopen = 1`.
- `allow_url_include = 1`.
- `extension=gd`.
- `date.timezone = "Asia/Jakarta"`.
- Pengaturan sesi antara lain `session.save_handler = files`, `session.gc_maxlifetime = 3600`, dan `session.use_strict_mode = 0`.
- Ada bagian konfigurasi `Pdo_mysql` dan `MySQLi`, termasuk default port MySQLi `3306`. Keberadaan pengaturan di php.ini tidak dengan sendirinya membuktikan ekstensi PDO MySQL sudah terpasang pada image; itu bergantung pada build image/runtime.
- Tidak terlihat konfigurasi password database yang diisi pada nilai `mysqli.default_pw`; nilainya kosong.

Catatan analisis:
- Zona waktu PHP disetel ke Asia/Jakarta.
- Batas upload 1 GB dan jumlah 200 file merupakan konfigurasi sangat longgar untuk aplikasi tugas sederhana; jangan menyalinnya tanpa alasan.
- `allow_url_include = 1` mengaktifkan kemampuan include file dari URL dan berisiko memperluas permukaan serangan. Untuk proyek baru, jangan aktifkan kecuali ada kebutuhan khusus yang benar-benar dipahami; default aman adalah tidak mengaktifkannya.
- `session.use_strict_mode = 0` tidak mengaktifkan strict session mode. Untuk aplikasi baru, pertimbangkan pengaturan sesi yang lebih aman.
- `extension=gd` meminta ekstensi GD dimuat; pastikan ekstensi benar-benar tersedia pada image sebelum mengandalkan fitur image processing.
- File ini adalah konfigurasi PHP lama yang panjang. Kita hanya mengambil pengaturan yang relevan untuk memahami latihan; tidak perlu menyalin seluruh php.ini ke proyek baru.

### 6.4 Kesimpulan pemeriksaan Nginx/PHP

Konfigurasi lama mengonfirmasi pola PHP-FPM + Nginx:
- Nginx menangani HTTP pada port 80.
- Request PHP diteruskan melalui FastCGI ke `php:9000`.
- PHP-FPM menjalankan kode PHP dari folder source yang di-mount bersama.
- Nginx melakukan fallback route ke `index.php` untuk pola front controller.

Untuk proyek tugas baru, jika kita memilih image PHP Apache, Apache akan menangani HTTP dan mengeksekusi PHP di dalam container aplikasi PHP yang sama. Dengan demikian, tidak diperlukan container Nginx tambahan dan rancangan tetap memiliki tiga service inti: Next.js, PHP Apache, dan MySQL.

Belum ada container latihan yang dijalankan ulang, diubah, atau dihentikan dalam pemeriksaan ini. Belum ada implementasi baru yang dibuat.

### 6.5 Status pemeriksaan latihan lama

| File | Status |
|---|---|
| `docker-compose.yaml` | Isi diperiksa |
| `build/php/Dockerfile` | Isi diperiksa |
| `htdocs/index.php` | Isi diperiksa |
| `build/nginx/nginx.conf` | Isi diperiksa |
| `build/nginx/conf.d/localapp.conf` | Isi diperiksa |
| `build/php/php.ini` | Isi diperiksa dari teks yang dibagikan |

**Titik lanjut:** pemeriksaan konfigurasi utama latihan lama selesai. Tahap berikutnya adalah memulai penyiapan workspace proyek baru secara terpisah, tanpa mengubah dua folder latihan yang ada. Sebelum membuat folder, pastikan lokasi root repository dan nama folder baru disepakati.


## 19 November 2026 — Klarifikasi struktur folder induk

Pemilik mengklarifikasi bahwa folder lokal `C:\\cloud-computing-1` adalah folder induk/workspace untuk seluruh proyek, bukan lokasi untuk membuat satu folder induk baru lagi.

Keputusan struktur:
- `mini-event-management/` tetap berada langsung di root sebagai folder proyek/latihan yang sudah ada.
- `praktek-docker/` tetap berada langsung di root sebagai folder proyek/latihan yang sudah ada.
- Folder baru `database/` akan ditambahkan langsung di root untuk konfigurasi dan inisialisasi MySQL bersama; SQL init akan ditempatkan di `database/init/`.
- `docker-compose.yml` untuk orkestrasi tiga service ditempatkan langsung di root.
- File `.env.example`, `.gitignore`, dan README proyek juga berada di root.
- Tidak perlu membuat folder induk baru atau memindahkan dua folder latihan yang sudah ada.

Struktur target konseptual:

```text
C:\\cloud-computing-1\\
├── mini-event-management\\
├── praktek-docker\\
├── database\\
│   └── init\\
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── PROJECT_CONTEXT_DOCKER_SHARED_MYSQL.md
└── PROJECT_PROGRESS_LOG.md
```

Struktur ini baru keputusan desain; belum ada folder/file implementasi yang dibuat. Penempatan Dockerfile dan source masing-masing aplikasi akan dipastikan setelah memeriksa isi aktual folder yang tersedia. Kedua folder latihan tetap tidak boleh ditimpa, dipindahkan, atau dihapus.

**Tahap berikutnya:** periksa isi root repository dan file/folder yang ada agar kita menentukan apakah folder `mini-event-management` dan `praktek-docker` memang akan menjadi dua app service tugas atau perlu disiapkan source aplikasi baru di dalamnya. Belum ada perubahan implementasi.


## 19 November 2026 — Penetapan folder aplikasi

Pemilik menetapkan bahwa folder lokal `mini-event-management/` akan menjadi aplikasi Next.js/JavaScript, sedangkan `praktek-docker/` akan menjadi aplikasi PHP. Folder `mini-event-management/` saat ini masih berisi salinan latihan PHP dari `praktek-docker/`; belum ada migrasi atau penghapusan file. Repository GitHub `mini-event-management` yang diberikan pemilik menjadi referensi source/domain Next.js, dan berbeda dari folder lokal bernama sama.

Folder `database/` akan ditambahkan di root untuk SQL MySQL bersama, sedangkan `docker-compose.yml` berada di root untuk orkestrasi tiga service. Langkah implementasi pertama adalah inventarisasi isi root dan kedua folder aplikasi sebelum memutuskan file mana yang dipertahankan, diganti, atau ditambahkan. Belum ada source code atau konfigurasi implementasi yang diubah.


## 19 November 2026 — Verifikasi workspace lokal (CMD)

Pemilik menjalankan pemeriksaan menggunakan Windows Command Prompt (CMD) dari `C:\\cloud-computing-1`.

Hasil `dir /a` pada root:
- `.git/` tersedia.
- `mini-event-management/` tersedia.
- `praktek-docker/` tersedia.
- `PROJECT_CONTEXT_DOCKER_SHARED_MYSQL.md` tersedia.
- `PROJECT_PROGRESS_LOG.md` tersedia.
- Belum ada folder `database/`, file `.env`, `.env.example`, `.gitignore`, atau root `docker-compose.yml` pada saat pemeriksaan.

Hasil `dir mini-event-management /a`:
- `build/`
- `htdocs/`
- `docker-compose.yaml`
- `README.md`

Hasil `dir praktek-docker /a`:
- `build/`
- `htdocs/`
- `docker-compose.yaml`
- `README.md`

Hasil `git status --short --branch`:

`## main...origin/main`

Artinya branch aktif `main` sinkron dengan `origin/main` dan tidak ada perubahan lokal yang belum di-commit pada saat pemeriksaan.

Catatan: pemeriksaan ini hanya mencatat keberadaan folder/file tingkat atas. Isi lengkap subfolder `build/` dan `htdocs/` belum diperiksa ulang dalam langkah ini. Tidak ada file yang diubah atau dihapus.

**Langkah berikutnya:** inventarisasi file di dalam kedua folder dengan `tree /F` atau `dir /s` agar strategi migrasi `mini-event-management/` menjadi Next.js dapat ditentukan tanpa kehilangan file latihan yang mungkin perlu disimpan.
