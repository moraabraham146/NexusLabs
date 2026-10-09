<?php
header("Content-Type: application/json");
require_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"), true);

if ($data) {
    try {
        $sql = "INSERT INTO usuarios (nombre, apellido, sexo, usuario, cedula, telefono, fecha_nacimiento, email, rol, password) 
                VALUES (:nom, :ape, :sex, :usu, :ced, :tel, :fec, :ema, :rol, :pass)";
        
        $stmt = $pdo->prepare($sql);
        
        // Encriptamos la contraseña por seguridad
        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);

        $stmt->execute([
            ':nom'  => $data['firstName'],
            ':ape'  => $data['lastName'],
            ':sex'  => $data['gender'],
            ':usu'  => $data['username'],
            ':ced'  => $data['cedula'],
            ':tel'  => $data['phone'],
            ':fec'  => $data['birthDate'],
            ':ema'  => $data['email'],
            ':rol'  => $data['role'],
            ':pass' => $passwordHash
        ]);

        echo json_encode(["success" => true, "message" => "¡Usuario registrado localmente!"]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
}
?>