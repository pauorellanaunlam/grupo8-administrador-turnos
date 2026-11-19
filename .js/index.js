
const estiloHidden = document.createElement("style");
estiloHidden.textContent = "[hidden] { display: none !important; }";
document.head.appendChild(estiloHidden);


const RUTA_ADMIN = ".html/admin.html";
const RUTA_USUARIO = ".html/usuario.html";

const KEY_USUARIOS = "usuarios";          // array de usuarios registrados
const KEY_SESION = "usuarioActivo";       // usuario logueado (sessionStorage)
const KEY_RECORDAR = "emailRecordado";    // email guardado por "Recordar usuario"

const PERFIL_ADMIN = "Administrador";
const PERFIL_USUARIO = "Usuario";

// ================== FUNCIONES DE DATOS ==================
function obtenerUsuarios() {
    try {
        return JSON.parse(localStorage.getItem(KEY_USUARIOS)) || [];
    } catch (e) {
        return [];
    }
}

function guardarUsuarios(usuarios) {
    localStorage.setItem(KEY_USUARIOS, JSON.stringify(usuarios));
}

function hayAdministrador() {
    return obtenerUsuarios().some(u => u.perfil === PERFIL_ADMIN);
}

function emailExiste(email) {
    return obtenerUsuarios().some(u => u.email === email);
}

// ================== UI ==================
const formLogin = document.getElementById("form-login");
const formAdmin = document.getElementById("form-admin-inicial");
const mensaje = document.getElementById("mensaje");
const accesoRapido = document.querySelector(".acceso-rapido");
const formRegistro = document.getElementById("form-registro");
const linkIrRegistro = document.getElementById("link-ir-registro");
const linkIrLogin = document.getElementById("link-ir-login");

function mostrarMensaje(texto, esError = true) {
    mensaje.textContent = texto;
    mensaje.style.color = esError ? "crimson" : "green";
}

// Muestra el login (con link a registro) o el registro (con link a login)
function mostrarLogin() {
    formLogin.hidden = false;
    formRegistro.hidden = true;
    linkIrRegistro.hidden = false;
    linkIrLogin.hidden = true;
    mensaje.textContent = "";
}

function mostrarRegistro() {
    formLogin.hidden = true;
    formRegistro.hidden = false;
    linkIrRegistro.hidden = true;
    linkIrLogin.hidden = false;
    mensaje.textContent = "";
}

function mostrarVistaInicial() {
    if (hayAdministrador()) {
        // Hay admin: login normal (con opción de registrarse como Usuario)
        formAdmin.hidden = true;
        if (accesoRapido) accesoRapido.hidden = false;
        mostrarLogin();
    } else {
        // No hay admin: obligamos a crear el primero
        formAdmin.hidden = false;
        formLogin.hidden = true;
        formRegistro.hidden = true;
        linkIrRegistro.hidden = true;
        linkIrLogin.hidden = true;
        if (accesoRapido) accesoRapido.hidden = true;
        mostrarMensaje("No hay administradores registrados. Creá el primero para continuar.", false);
    }
}

// ================== REGISTRO DE USUARIOS (perfil Usuario) ==================
document.getElementById("btn-ir-registro").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarRegistro();
});

document.getElementById("btn-ir-login").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarLogin();
});

formRegistro.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("reg-nombre").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-password").value;
    const password2 = document.getElementById("reg-password2").value;

    if (!nombre) {
        mostrarMensaje("Ingresá tu nombre.");
        return;
    }
    if (password.length < 6) {
        mostrarMensaje("La contraseña debe tener al menos 6 caracteres.");
        return;
    }
    if (password !== password2) {
        mostrarMensaje("Las contraseñas no coinciden.");
        return;
    }
    if (emailExiste(email)) {
        mostrarMensaje("Ese correo ya está registrado.");
        return;
    }

    const usuarios = obtenerUsuarios();
    usuarios.push({
        id: Date.now(),
        nombre,
        email,
        password, // solo para el TP: en un sistema real se hashea
        perfil: PERFIL_USUARIO // siempre Usuario, nunca Administrador
    });
    guardarUsuarios(usuarios);

    formRegistro.reset();
    mostrarLogin();
    document.getElementById("email").value = email;
    mostrarMensaje("Cuenta creada. Ya podés iniciar sesión.", false);
});

function redirigirSegunPerfil(usuario) {
    window.location.href = usuario.perfil === PERFIL_ADMIN ? RUTA_ADMIN : RUTA_USUARIO;
}

// ================== CREAR PRIMER ADMINISTRADOR ==================
formAdmin.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("admin-nombre").value.trim();
    const email = document.getElementById("admin-email").value.trim().toLowerCase();
    const password = document.getElementById("admin-password").value;
    const password2 = document.getElementById("admin-password2").value;

    if (!nombre) {
        mostrarMensaje("Ingresá tu nombre.");
        return;
    }
    if (password.length < 6) {
        mostrarMensaje("La contraseña debe tener al menos 6 caracteres.");
        return;
    }
    if (password !== password2) {
        mostrarMensaje("Las contraseñas no coinciden.");
        return;
    }
    if (emailExiste(email)) {
        mostrarMensaje("Ese correo ya está registrado.");
        return;
    }

    const usuarios = obtenerUsuarios();
    usuarios.push({
        id: Date.now(),
        nombre,
        email,
        password, 
        perfil: PERFIL_ADMIN
    });
    guardarUsuarios(usuarios);

    formAdmin.reset();
    mostrarVistaInicial();
    mostrarMensaje("Administrador creado. Ya podés iniciar sesión.", false);
});

// ================== LOGIN ==================
formLogin.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const recordar = document.getElementById("remember-me").checked;

    const usuario = obtenerUsuarios().find(
        u => u.email === email && u.password === password
    );

    if (!usuario) {
        mostrarMensaje("Correo o contraseña incorrectos.");
        return;
    }

    // Recordar usuario
    if (recordar) {
        localStorage.setItem(KEY_RECORDAR, email);
    } else {
        localStorage.removeItem(KEY_RECORDAR);
    }

    // Guardamos la sesión (sin la contraseña)
    sessionStorage.setItem(KEY_SESION, JSON.stringify({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        perfil: usuario.perfil
    }));

    redirigirSegunPerfil(usuario);
});

// ================== INICIO ==================
document.addEventListener("DOMContentLoaded", () => {
    // Si ya hay sesión activa, ir directo a su página
    const sesion = JSON.parse(sessionStorage.getItem(KEY_SESION) || "null");
    if (sesion) {
        redirigirSegunPerfil(sesion);
        return;
    }

    mostrarVistaInicial();

    // Precargar email recordado
    const recordado = localStorage.getItem(KEY_RECORDAR);
    if (recordado) {
        document.getElementById("email").value = recordado;
        document.getElementById("remember-me").checked = true;
    }
});