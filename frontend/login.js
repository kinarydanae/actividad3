const API_URL = "http://localhost:3000";
const loginForm = document.getElementById("loginForm");
const error = document.getElementById("error");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    error.textContent = "";

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            error.textContent = data.error || "Error al iniciar sesión";
            return;
        }

        // Guardar token
        localStorage.setItem("token", data.token);

        // Redirigir a la página de tareas
        window.location.href = "index.html";
    } catch (err) {
        error.textContent = "Servidor no disponible";
    }
});