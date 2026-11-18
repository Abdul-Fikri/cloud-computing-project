
<?php

require_once __DIR__ . '/db.php';

$message = '';

// Memproses form tambah event
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $eventDate = $_POST['event_date'] ?? '';
    $location = trim($_POST['location'] ?? '');

    if ($name === '' || $eventDate === '') {
        $message = 'Nama event dan tanggal wajib diisi.';
    } else {
        $date = DateTime::createFromFormat('!Y-m-d', $eventDate);

        if (!$date || $date->format('Y-m-d') !== $eventDate) {
            $message = 'Format tanggal tidak valid.';
        } else {
            $stmt = $pdo->prepare(
                "INSERT INTO events (name, description, event_date, location)
                 VALUES (:name, :description, :event_date, :location)"
            );

            $stmt->execute([
                'name' => $name,
                'description' => $description !== '' ? $description : null,
                'event_date' => $eventDate,
                'location' => $location !== '' ? $location : null,
            ]);

            header('Location: /');
            exit;
        }
    }
}

// Mengambil data event
$stmt = $pdo->query(
    "SELECT id, name, description, event_date, location
     FROM events
     ORDER BY event_date ASC"
);

$events = $stmt->fetchAll();

?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP Demo App</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f3f4f6;
            margin: 0;
            padding: 40px;
        }

        .container {
            max-width: 900px;
            margin: auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
        }

        h1 {
            color: #2563eb;
        }

        input, textarea, button {
            width: 100%;
            padding: 10px;
            margin: 8px 0 16px;
            box-sizing: border-box;
        }

        button {
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
        }

        th, td {
            padding: 12px;
            border: 1px solid #ddd;
            text-align: left;
        }

        th {
            background: #2563eb;
            color: white;
        }

        .status {
            color: #15803d;
            font-weight: bold;
        }

        .error {
            color: #dc2626;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>PHP Demo App</h1>

        <p class="status">Berhasil terhubung ke MySQL!</p>

        <h2>Tambah Event Baru</h2>

        <?php if ($message !== ''): ?>
            <p class="error">
                <?= htmlspecialchars($message) ?>
            </p>
        <?php endif; ?>

        <form method="POST">
            <label>Nama Event</label>
            <input type="text" name="name" maxlength="150" required>

            <label>Deskripsi</label>
            <textarea name="description"></textarea>

            <label>Tanggal Event</label>
            <input type="date" name="event_date" required>

            <label>Lokasi</label>
            <input type="text" name="location" maxlength="255">

            <button type="submit">Simpan Event</button>
        </form>

        <hr>

        <h2>Daftar Event</h2>

        <?php if (count($events) > 0): ?>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nama Event</th>
                        <th>Tanggal</th>
                        <th>Lokasi</th>
                    </tr>
                </thead>

                <tbody>
                    <?php foreach ($events as $event): ?>
                        <tr>
                            <td><?= htmlspecialchars((string) $event['id']) ?></td>
                            <td><?= htmlspecialchars($event['name']) ?></td>
                            <td><?= htmlspecialchars($event['event_date']) ?></td>
                            <td><?= htmlspecialchars($event['location'] ?? '-') ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <p>Belum ada event di database.</p>
        <?php endif; ?>
    </div>
</body>
</html>
