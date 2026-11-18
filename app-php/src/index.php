
<?php
$pageTitle = "PHP Demo App";
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle) ?></title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f3f4f6;
            margin: 0;
            padding: 40px;
        }

        .container {
            max-width: 600px;
            margin: 50px auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            text-align: center;
        }

        h1 {
            color: #2563eb;
        }

        .status {
            color: #15803d;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><?= htmlspecialchars($pageTitle) ?></h1>

        <p>Selamat datang di aplikasi PHP.</p>

        <p class="status">
            PHP berhasil dijalankan!
        </p>

        <p>
            Aplikasi ini nantinya akan terhubung
            ke database MySQL bersama.
        </p>
    </div>
</body>
</html>
