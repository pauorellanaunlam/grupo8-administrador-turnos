/**
 * =============================================================================
 * usuario.html
 * - Muestra los turnos PUBLICADOS por el administrador (localStorage)
 * - Reservar turno: lo mueve a "reservados" (lo ve admin.html y miperfil.html)
 * - Filtro por especialidad, favoritos, vista tarjetas / lista
 * =============================================================================
 */

// Claves compartidas con admin.js y miperfil.js (tienen que ser iguales)
const CLAVE_PUBLICADOS = "admin_turnosPublicados_v2";
const CLAVE_RESERVADOS = "admin_turnosReservados_v2";
const CLAVE_FAVORITOS = "favoritosProfesionales_v2";
const PACIENTE_ACTUAL_ID = "paciente-actual";

// Mismos datos iniciales que admin.js (se usan solo la primera vez)
const PUBLICADOS_INICIALES = [
  { id: 1, especialidad: "Clínica médica", profesional: "Dra. María González", fecha: "2026-11-23", hora: "09:30", sede: "Sede Lugano", comentario: "Consultorio 1" },
  { id: 2, especialidad: "Cardiología", profesional: "Dr. Carlos Ramírez", fecha: "2026-11-24", hora: "11:00", sede: "Sede Ramos Mejía", comentario: "Consultorio 3" }
];

const RESERVADOS_INICIALES = [
  { id: 101, especialidad: "Clínica médica", profesional: "Dra. María González", fecha: "2026-11-18", hora: "10:00", sede: "Sede Lugano", comentario: "Consultorio 1", paciente: "Juan Pérez" },
  { id: 102, especialidad: "Cardiología", profesional: "Dr. Carlos Ramírez", fecha: "2026-11-20", hora: "11:30", sede: "Sede Ramos Mejía", comentario: "Consultorio 3", paciente: "Ana Rodríguez" },
  { id: 103, especialidad: "Dermatología", profesional: "Dra. Laura Medina", fecha: "2026-11-25", hora: "15:00", sede: "Consulta virtual", comentario: "", paciente: "Lucía Méndez" },
  { id: 104, especialidad: "Clínica médica", profesional: "Dr. Martín Acosta", fecha: "2026-11-27", hora: "09:00", sede: "Sede San Isidro", comentario: "Consultorio 2", paciente: "Diego Fernández" }
];

// -----------------------------------------------------------------------------
// UTILIDADES
// -----------------------------------------------------------------------------
function cargarLista(clave, valorInicial) {
  const raw = localStorage.getItem(clave);
  if (raw === null) return valorInicial.slice();
  try {
    const lista = JSON.parse(raw);
    return Array.isArray(lista) ? lista : valorInicial.slice();
  } catch (err) {
    return valorInicial.slice();
  }
}

function guardarLista(clave, lista) {
  localStorage.setItem(clave, JSON.stringify(lista));
}

function escapar(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatearFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function obtenerNombrePaciente() {
  try {
    const datos = JSON.parse(localStorage.getItem("datosPerfil"));
    if (datos && datos.nombre) return datos.nombre;
  } catch (err) {}
  return "María Pérez";
}

// -----------------------------------------------------------------------------
// FAVORITOS (se guardan por profesional: { nombre, especialidad })
// -----------------------------------------------------------------------------
function obtenerFavoritos() {
  const guardado = localStorage.getItem(CLAVE_FAVORITOS);
  if (guardado === null) {
    const inicial = [{ nombre: "Dra. María González", especialidad: "Clínica médica" }];
    guardarLista(CLAVE_FAVORITOS, inicial);
    return inicial;
  }
  try {
    const lista = JSON.parse(guardado);
    return Array.isArray(lista) ? lista : [];
  } catch (err) {
    return [];
  }
}

function toggleFavorito(turno) {
  let favoritos = obtenerFavoritos();
  const yaEra = favoritos.some((f) => f.nombre === turno.profesional);

  if (yaEra) {
    favoritos = favoritos.filter((f) => f.nombre !== turno.profesional);
    mostrarPopup(`Quitaste a ${turno.profesional} de favoritos`, "quitado");
  } else {
    favoritos.push({ nombre: turno.profesional, especialidad: turno.especialidad });
    mostrarPopup(`❤️ Agregaste a ${turno.profesional} a favoritos`, "agregado");
  }

  guardarLista(CLAVE_FAVORITOS, favoritos);
}

// -----------------------------------------------------------------------------
// POP UP
// -----------------------------------------------------------------------------
let timeoutPopup;

function mostrarPopup(mensaje, tipo = "agregado") {
  let popup = document.getElementById("popup-favorito");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup-favorito";
    popup.setAttribute("role", "status");
    document.body.appendChild(popup);
  }

  popup.textContent = mensaje;
  popup.className = `popup-favorito ${tipo}`;
  void popup.offsetWidth; // reinicia la animación si se toca rápido
  popup.classList.add("visible");

  clearTimeout(timeoutPopup);
  timeoutPopup = setTimeout(() => popup.classList.remove("visible"), 2600);
}

// -----------------------------------------------------------------------------
// RESERVAR TURNO: publicados -> reservados
// -----------------------------------------------------------------------------
function reservarTurno(id) {
  const publicados = cargarLista(CLAVE_PUBLICADOS, PUBLICADOS_INICIALES);
  const indice = publicados.findIndex((t) => t.id === id);

  // Pudo haber sido reservado/eliminado desde otra pestaña
  if (indice === -1) {
    mostrarPopup("Ese turno ya no está disponible", "quitado");
    return false;
  }

  const turno = publicados.splice(indice, 1)[0];
  const reservados = cargarLista(CLAVE_RESERVADOS, RESERVADOS_INICIALES);

  reservados.unshift({
    ...turno,
    paciente: obtenerNombrePaciente(),
    reservadoPor: PACIENTE_ACTUAL_ID,
    reservadoEl: new Date().toLocaleString()
  });

  guardarLista(CLAVE_PUBLICADOS, publicados);
  guardarLista(CLAVE_RESERVADOS, reservados);

  mostrarPopup(
    `✅ Turno reservado con ${turno.profesional} · ${formatearFecha(turno.fecha)} ${turno.hora} hs`,
    "agregado"
  );
  return true;
}

// -----------------------------------------------------------------------------
// INICIO
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("lista-profesionales");
  const selectEspecialidad = document.getElementById("buscar-especialidad");
  const btnBuscar = document.getElementById("btn-buscar-turnos");

  function renderizarProfesionales() {
    // Los turnos guardan el texto ("Cardiología"), no el value del select
    const especialidad =
      selectEspecialidad.value === ""
        ? ""
        : selectEspecialidad.options[selectEspecialidad.selectedIndex].text;

    const favoritos = obtenerFavoritos();
    const hoy = hoyISO();

    const disponibles = cargarLista(CLAVE_PUBLICADOS, PUBLICADOS_INICIALES)
      .filter((t) => t.fecha >= hoy)
      .filter((t) => especialidad === "" || t.especialidad === especialidad)
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

    if (disponibles.length === 0) {
      lista.innerHTML = `<p class="mensaje-sin-turnos">No hay turnos disponibles para esta especialidad.</p>`;
      return;
    }

    lista.innerHTML = disponibles
      .map((t) => {
        const esFav = favoritos.some((f) => f.nombre === t.profesional);
        const ubicacion = t.comentario ? `${t.sede} · ${t.comentario}` : t.sede;
        return `
          <article class="card-turno" data-id="${t.id}">
            <h3>${escapar(t.profesional)}</h3>
            <p>${escapar(t.especialidad)}</p>

            <div class="card-turno-datos">
              <p>Turno: ${formatearFecha(t.fecha)} · ${escapar(t.hora)} hs</p>
              <p>${escapar(ubicacion)}</p>
            </div>

            <button type="button"
                    class="button-favorito ${esFav ? "activo" : ""}"
                    aria-label="${esFav ? "Quitar de favoritos" : "Agregar a favoritos"}"
                    aria-pressed="${esFav}">${esFav ? "♥" : "♡"}</button>

            <button type="button" class="button-reservar-card">
              Reservar turno
            </button>
          </article>
        `;
      })
      .join("");
  }

  selectEspecialidad.addEventListener("change", renderizarProfesionales);
  btnBuscar.addEventListener("click", renderizarProfesionales);

  lista.addEventListener("click", (e) => {
    const tarjeta = e.target.closest(".card-turno");
    if (!tarjeta) return;
    const id = Number(tarjeta.dataset.id);

    if (e.target.closest(".button-favorito")) {
      const turno = cargarLista(CLAVE_PUBLICADOS, PUBLICADOS_INICIALES).find((t) => t.id === id);
      if (!turno) return;
      toggleFavorito(turno);
      renderizarProfesionales();
      return;
    }

    if (e.target.closest(".button-reservar-card")) {
      reservarTurno(id);
      renderizarProfesionales();
    }
  });

  // Si el admin publica/elimina o se reserva desde otra pestaña, se actualiza solo
  window.addEventListener("storage", renderizarProfesionales);

  renderizarProfesionales();
});

// -----------------------------------------------------------------------------
// BOTONES DE VISTA: TARJETAS / LISTA
// -----------------------------------------------------------------------------
const contenedorProfesionales = document.getElementById("lista-profesionales");
const botonesVista = document.querySelectorAll(".selector-vista [data-vista]");

if (contenedorProfesionales && botonesVista.length) {
  function aplicarVista(vista) {
    contenedorProfesionales.classList.toggle("vista-lista", vista === "lista");
    botonesVista.forEach((boton) => {
      boton.classList.toggle("activo", boton.dataset.vista === vista);
    });
    try {
      localStorage.setItem("vistaProfesionales", vista);
    } catch (e) {}
  }

  botonesVista.forEach((boton) => {
    boton.addEventListener("click", () => aplicarVista(boton.dataset.vista));
  });

  let guardada = "tarjetas";
  try {
    guardada = localStorage.getItem("vistaProfesionales") || "tarjetas";
  } catch (e) {}
  aplicarVista(guardada);
}