<?php
header("Content-Type: application/json");
require_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"), true);

if ($data) {
    try {
        $sql = "SELECT * FROM usuarios WHERE usuario = :usu";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':usu' => $data['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verificamos si el usuario existe y la contraseña es correcta
        if ($user && password_verify($data['password'], $user['password'])) {
            // No enviamos la contraseña de vuelta por seguridad
            unset($user['password']);
            echo json_encode([
                "success" => true, 
                "message" => "Login correcto",
                "user" => $user
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrectos"]);
        }
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
}
?>