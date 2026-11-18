
FROM php:8.4-apache

# Install ekstensi PHP untuk koneksi ke MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Folder kerja aplikasi
WORKDIR /var/www/html

# Salin source code PHP ke Apache
COPY src/ /var/www/html/

# Port web Apache
EXPOSE 80
