
<?php

require_once __DIR__ . '/db.php';

// Mengambil data event dari MySQL
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
    </style>
</head>

<body>
    <div class="container">
        <h1>PHP Demo App</h1>

        <p class="status">
            Berhasil terhubung ke MySQL!
        </p>

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
