// La URL apunta a la carpeta backend
const API_BASE_URL = "http://localhost/NexusLabs/backend";

/**
 * Función para registrar un nuevo usuario
 * @param {Object} userData
 */
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/register.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }

        return await response.json();
    } catch (error) {
        console.error("Error en registerUser:", error);
        return { success: false, message: "No se pudo conectar con el servidor local." };
    }
}

/**
 * Función para iniciar sesión
 * @param {Object} credentials
 */
async function loginUser(credentials) {
    try {
        const response = await fetch(`${API_BASE_URL}/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }

        return await response.json();
    } catch (error) {
        console.error("Error en loginUser:", error);
        return { success: false, message: "Error de conexión con MariaDB." };
    }
}