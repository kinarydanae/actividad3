const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const auth = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = 3000;
const SECRET = "clave_super_secreta";

app.use(cors());
app.use(express.json());

/* FRONTEND */
const frontendPath = path.join(__dirname, "../frontend");

app.use(express.static(frontendPath));

/*usuarios */
/* REGISTER */
app.post("/register", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const usersPath = path.join(__dirname, "users.json");
        const users = JSON.parse(await fs.readFile(usersPath, "utf8"));

        const existe = users.find(u => u.email === email);
        if (existe) {
            return res.status(400).json({ error: "El usuario ya existe" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const nuevoUsuario = {
            id: Date.now(),
            email,
            password: hashedPassword
        };

        users.push(nuevoUsuario);
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

        res.status(201).json({ message: "Usuario registrado correctamente" });
    } catch (err) {
        next(err);
    }
});
/* LOGIN */
app.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const usersPath = path.join(__dirname, "users.json");
        const users = JSON.parse(await fs.readFile(usersPath, "utf8"));

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const passwordOk = await bcrypt.compare(password, user.password);
        if (!passwordOk) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token });
    } catch (err) {
        next(err);
    }
});

/* USUARIOS (PROTEGIDOS) */
app.get("/users", auth, async (req, res, next) => {
    try {
        const usersPath = path.join(__dirname, "users.json");
        const users = JSON.parse(await fs.readFile(usersPath, "utf8"));

        const safeUsers = users.map(u => ({
            id: u.id,
            email: u.email
        }));

        res.json(safeUsers);
    } catch (err) {
        next(err);
    }
});

/* USUARIO POR ID (PROTEGIDO) */
app.get("/users/:id", auth, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const usersPath = path.join(__dirname, "users.json");
        const users = JSON.parse(await fs.readFile(usersPath, "utf8"));

        const user = users.find(u => u.id === id);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({ id: user.id, email: user.email });
    } catch (err) {
        next(err);
    }
});

/* ACTUALIZAR USUARIO (PROTEGIDO) */
app.put("/users/:id", auth, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { email, password } = req.body;

        const usersPath = path.join(__dirname, "users.json");
        const users = JSON.parse(await fs.readFile(usersPath, "utf8"));

        const index = users.findIndex(u => u.id === id);
        if (index === -1) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        if (email) users[index].email = email;
        if (password) {
            users[index].password = await bcrypt.hash(password, 10);
        }

        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

        res.json({ message: "Usuario actualizado" });
    } catch (err) {
        next(err);
    }
});

/* ELIMINAR USUARIO (PROTEGIDO) */
app.delete("/users/:id", auth, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const usersPath = path.join(__dirname, "users.json");
        let users = JSON.parse(await fs.readFile(usersPath, "utf8"));

        const existe = users.some(u => u.id === id);
        if (!existe) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        users = users.filter(u => u.id !== id);
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

        res.json({ message: "Usuario eliminado" });
    } catch (err) {
        next(err);
    }
});

/* TAREAS (PROTEGIDAS) */
app.get("/tareas", auth, async (req, res, next) => {
    try {
        const data = await fs.readFile("tareas.json", "utf8");
        res.json(JSON.parse(data));
    } catch (err) {
        next(err);
    }
});

app.post("/tareas", auth, async (req, res, next) => {
    try {
        const { titulo, descripcion } = req.body;
        const tareas = JSON.parse(await fs.readFile("tareas.json", "utf8"));

        const nueva = {
            id: Date.now(),
            titulo,
            descripcion,
            completada: false
        };

        tareas.push(nueva);
        await fs.writeFile("tareas.json", JSON.stringify(tareas, null, 2));
        res.status(201).json(nueva);
    } catch (err) {
        next(err);
    }
});

app.put("/tareas/:id", auth, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { titulo, descripcion, completada } = req.body;

        const tareasPath = path.join(__dirname, "tareas.json");
        const tareas = JSON.parse(await fs.readFile(tareasPath, "utf8"));

        const index = tareas.findIndex(t => t.id === id);
        if (index === -1) {
            return res.status(404).json({ error: "Tarea no encontrada" });
        }

        tareas[index] = {
            ...tareas[index],
            titulo: titulo ?? tareas[index].titulo,
            descripcion: descripcion ?? tareas[index].descripcion,
            completada: completada ?? tareas[index].completada
        };

        await fs.writeFile(tareasPath, JSON.stringify(tareas, null, 2));
        res.json(tareas[index]);
    } catch (err) {
        next(err);
    }
});

app.delete("/tareas/:id", auth, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        let tareas = JSON.parse(await fs.readFile("tareas.json", "utf8"));

        tareas = tareas.filter(t => t.id !== id);
        await fs.writeFile("tareas.json", JSON.stringify(tareas, null, 2));

        res.json({ message: "Tarea eliminada" });
    } catch (err) {
        next(err);
    }
});

/* ERROR HANDLER */
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});