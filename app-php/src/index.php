<?php
require_once __DIR__ . '/db.php';

$message = '';
$error = '';
$groupId = trim((string) (getenv('PHP_DEFAULT_GROUP_ID') ?: ''));

function h($value): string {
    return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES, 'UTF-8');
}

$group = null;
$events = [];

if ($groupId === '') {
    $error = 'PHP_DEFAULT_GROUP_ID belum diatur. Isi ID grup Owner dari aplikasi Next.js pada file .env, lalu restart service app-php.';
} else {
    try {
        $groupStmt = $pdo->prepare("SELECT id, name FROM `groups` WHERE id = ? LIMIT 1");
        $groupStmt->execute([$groupId]);
        $group = $groupStmt->fetch();

        if (!$group) {
            $error = 'Grup dengan PHP_DEFAULT_GROUP_ID tersebut tidak ditemukan. Periksa kembali ID grup pada file .env.';
        }
    } catch (PDOException $e) {
        error_log('Gagal memuat grup PHP demo: ' . $e->getMessage());
        $error = 'Struktur database belum siap. Pastikan schema Mini Event Management sudah diterapkan.';
    }
}

if ($group && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $eventDate = trim($_POST['event_date'] ?? '');
    $location = trim($_POST['location'] ?? '');

    if ($name === '' || mb_strlen($name) > 160 || $eventDate === '') {
        $message = 'Nama event wajib diisi (maksimal 160 karakter) dan tanggal wajib dipilih.';
    } else {
        $date = DateTime::createFromFormat('!Y-m-d', $eventDate);
        if (!$date || $date->format('Y-m-d') !== $eventDate) {
            $message = 'Format tanggal tidak valid.';
        } else {
            try {
                $id = sprintf(
                    '%s-%s-%s-%s-%s',
                    bin2hex(random_bytes(4)),
                    bin2hex(random_bytes(2)),
                    bin2hex(random_bytes(2)),
                    bin2hex(random_bytes(2)),
                    bin2hex(random_bytes(6))
                );
                $stmt = $pdo->prepare(
                    "INSERT INTO events (id, group_id, name, description, start_date, location, status_mode, status)
                     VALUES (?, ?, ?, ?, ?, ?, 'automatic', 'planned')"
                );
                $stmt->execute([
                    $id,
                    $group['id'],
                    $name,
                    $description !== '' ? $description : null,
                    $eventDate,
                    $location !== '' ? $location : null,
                ]);
                header('Location: /');
                exit;
            } catch (PDOException $e) {
                error_log('Gagal menyimpan event dari PHP: ' . $e->getMessage());
                $message = 'Event gagal disimpan. Periksa schema dan koneksi MySQL.';
            }
        }
    }
}

if ($group) {
    try {
        $stmt = $pdo->prepare(
            "SELECT id, name, description, start_date, location, status
             FROM events
             WHERE group_id = ?
             ORDER BY start_date ASC, created_at DESC"
        );
        $stmt->execute([$group['id']]);
        $events = $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('Gagal mengambil event PHP: ' . $e->getMessage());
        $error = 'Data event gagal dimuat. Pastikan schema MySQL sudah sesuai.';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP — Shared Event Workspace</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 32px 16px; color: #111827; }
        .container { max-width: 960px; margin: auto; padding: 28px; background: white; border-radius: 14px; box-shadow: 0 8px 28px rgba(15,23,42,.07); }
        h1 { color: #1d4ed8; margin-top: 0; }
        .muted { color: #6b7280; }
        input, textarea, button { width: 100%; padding: 11px 12px; margin: 7px 0 15px; border: 1px solid #d1d5db; border-radius: 7px; font: inherit; }
        textarea { min-height: 85px; resize: vertical; }
        button { background: #2563eb; color: white; border: 0; cursor: pointer; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; border: 1px solid #e5e7eb; text-align: left; }
        th { background: #1d4ed8; color: white; }
        .notice { padding: 12px 14px; border-radius: 8px; background: #eff6ff; color: #1e40af; margin: 16px 0; }
        .error { padding: 12px 14px; border-radius: 8px; background: #fef2f2; color: #b91c1c; margin: 16px 0; }
        .success { color: #15803d; font-weight: 600; }
        code { overflow-wrap: anywhere; }
    </style>
</head>
<body>
<div class="container">
    <h1>PHP Event Workspace</h1>
    <p class="success">Terhubung ke MySQL bersama</p>
    <?php if ($group): ?>
        <div class="notice">Grup aktif: <strong><?= h($group['name']) ?></strong><br><small>ID grup: <code><?= h($group['id']) ?></code></small></div>
    <?php endif; ?>

    <?php if ($error !== ''): ?><div class="error"><?= h($error) ?></div><?php endif; ?>
    <?php if ($message !== ''): ?><div class="error"><?= h($message) ?></div><?php endif; ?>

    <?php if ($group): ?>
        <h2>Tambah Event Baru</h2>
        <form method="POST">
            <label for="name">Nama Event</label>
            <input id="name" type="text" name="name" maxlength="160" required>
            <label for="description">Deskripsi</label>
            <textarea id="description" name="description" maxlength="2000"></textarea>
            <label for="event_date">Tanggal Mulai</label>
            <input id="event_date" type="date" name="event_date" required>
            <label for="location">Lokasi</label>
            <input id="location" type="text" name="location" maxlength="200">
            <button type="submit">Simpan Event</button>
        </form>
        <hr>
        <h2>Daftar Event Grup Ini</h2>
        <?php if ($events): ?>
            <table>
                <thead><tr><th>Nama Event</th><th>Tanggal Mulai</th><th>Lokasi</th><th>Status</th></tr></thead>
                <tbody>
                <?php foreach ($events as $event): ?>
                    <tr>
                        <td><?= h($event['name']) ?></td>
                        <td><?= h($event['start_date']) ?></td>
                        <td><?= h($event['location'] ?: '-') ?></td>
                        <td><?= h($event['status']) ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <p class="muted">Belum ada event untuk grup ini.</p>
        <?php endif; ?>
    <?php endif; ?>
</div>
</body>
</html>
