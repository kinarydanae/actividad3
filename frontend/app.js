const API_URL = "http://localhost:3000";
let TOKEN = localStorage.getItem("token");

// si no hay sesión, regresar al login
if (!TOKEN) {
    window.location.href = "login.html";
}

/* LOGIN */
async function login(email, password) {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.error || "Error al iniciar sesión");
        return;
    }

    TOKEN = data.token;
}

/* gESTOR DE TAREAS */
class GestorDeTareas {
    constructor(listaElemento) {
        this.tareas = [];
        this.listaElemento = listaElemento;
    }

    async cargarTareas() {
        const res = await fetch(`${API_URL}/tareas`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        this.tareas = await res.json();
        this.render();
    }

    async agregar(texto) {
        await fetch(`${API_URL}/tareas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`
            },
            body: JSON.stringify({
                titulo: texto,
                descripcion: "Desde frontend"
            })
        });

        this.cargarTareas();
    }

    async eliminar(index) {
        const tarea = this.tareas[index];

        await fetch(`${API_URL}/tareas/${tarea.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        this.cargarTareas();
    }

    async editar(index, nuevoTexto) {
        const tarea = this.tareas[index];

        await fetch(`${API_URL}/tareas/${tarea.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`
            },
            body: JSON.stringify({
                titulo: nuevoTexto,
                descripcion: tarea.descripcion
            })
        });

        this.cargarTareas();
    }

    async toggleCompletada(index) {
    const tarea = this.tareas[index];

    await fetch(`${API_URL}/tareas/${tarea.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`
        },
        body: JSON.stringify({
            completada: !tarea.completada
        })
    });

    this.cargarTareas();
    }   


    render() {
        this.listaElemento.innerHTML = "";

        this.tareas.forEach((tarea, index) => {
            const li = document.createElement("li");
            li.className = "task";

            li.innerHTML = `
                <label>
                    <input type="checkbox" ${tarea.completada ? "checked" : ""}>
                    <p class="${tarea.completada ? "checked" : ""}">${tarea.titulo}</p>
                </label>
                <div class="actions">
                    <span class="edit">
                        <i class="uil uil-pen"></i>
                    </span>
                    <span class="delete">
                        <i class="uil uil-trash"></i>
                    </span>
                </div>
            `;

            li.querySelector(".delete").addEventListener("click", () => {
                this.eliminar(index);
            });

            li.querySelector(".edit").addEventListener("click", () => {
                this.habilitarEdicion(li, index);
            });
            li.querySelector("input").addEventListener("change", () => {
                this.toggleCompletada(index);
            });


            this.listaElemento.appendChild(li);
        });
    }

    /* edicion*/
    habilitarEdicion(li, index) {
        const texto = li.querySelector("p");
        const btnIcon = li.querySelector(".edit i");

        texto.contentEditable = "true";
        texto.focus();
        btnIcon.className = "uil uil-check";

        texto.onkeydown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                texto.contentEditable = "false";
                btnIcon.className = "uil uil-pen";

                const nuevoTexto = texto.textContent.trim();
                if (nuevoTexto !== "") {
                    this.editar(index, nuevoTexto);
                }
            }
        };

        texto.onblur = () => {
            texto.contentEditable = "false";
            btnIcon.className = "uil uil-pen";
        };
    }
}

/* INICIALIZACIoN*/
const input = document.querySelector("#newtask input");
const btn = document.querySelector("#push");
const lista = document.querySelector(".task-list");

(async () => {
    const gestor = new GestorDeTareas(lista);
    await gestor.cargarTareas();

    btn.addEventListener("click", () => {
        if (input.value.trim() === "") {
            alert("¡Por favor ingresa una tarea!");
            return;
        }

        gestor.agregar(input.value.trim());
        input.value = "";
    });

    input.addEventListener("keyup", (e) => {
        if (e.key === "Enter") btn.click();
    });
})();

/* CERRAR SESION */
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", () => {
        // Borra el token y redirige al login
        TOKEN = "";
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });
});
