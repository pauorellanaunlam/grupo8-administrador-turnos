/**
 * =============================================================================
 * FILTRO POR ESPECIALIDAD - FAVORITOS - BOTON DE TARJETAS / LISTAS 
 * =============================================================================
 */

const KEY_FAVORITOS = "profesionalesFavoritos";

const PROFESIONALES = [
  { id: 1, nombre: "Dra. María González", especialidad: "clinica", nombreEsp: "Clínica médica", proximo: "09/11/2026 · 09:30 hs", consultorio: "Consultorio 1" },
  { id: 2, nombre: "Dr. Carlos Ramírez", especialidad: "cardiologia", nombreEsp: "Cardiología", proximo: "10/11/2026 · 11:00 hs", consultorio: "Consultorio 3" },
  { id: 3, nombre: "Dra. Laura Medina", especialidad: "dermatologia", nombreEsp: "Dermatología", proximo: "11/11/2026 · 14:30 hs", consultorio: "Consultorio 2" },
  { id: 4, nombre: "Dr. Pablo Giménez", especialidad: "clinica", nombreEsp: "Clínica médica", proximo: "12/11/2026 · 10:00 hs", consultorio: "Consultorio 4" },
  { id: 5, nombre: "Dra. Laura Martínez", especialidad: "cardiologia", nombreEsp: "Cardiología", proximo: "12/11/2026 · 15:30 hs", consultorio: "Consultorio 5" },
  { id: 6, nombre: "Dr. Andrés Vega", especialidad: "dermatologia", nombreEsp: "Dermatología", proximo: "13/11/2026 · 09:00 hs", consultorio: "Consultorio 6" }
];

// -----------------------------------------------------------------------------
// FAVORITOS
// -----------------------------------------------------------------------------
function obtenerFavoritos() {
  const guardado = localStorage.getItem(KEY_FAVORITOS);
  if (guardado === null) {
    localStorage.setItem(KEY_FAVORITOS, JSON.stringify([1]));
    return [1];
  }
  try {
    return JSON.parse(guardado) || [];
  } catch (err) {
    return [];
  }
}

function toggleFavorito(id) {
  const prof = PROFESIONALES.find((p) => p.id === id);
  let favoritos = obtenerFavoritos();
  const yaEra = favoritos.includes(id);

  if (yaEra) {
    favoritos = favoritos.filter((f) => f !== id);
    mostrarPopup(`Quitaste a ${prof.nombre} de favoritos`, "quitado");
  } else {
    favoritos.push(id);
    mostrarPopup(`❤️ Agregaste a ${prof.nombre} a favoritos`, "agregado");
  }

  localStorage.setItem(KEY_FAVORITOS, JSON.stringify(favoritos));
  return !yaEra;
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
  timeoutPopup = setTimeout(() => popup.classList.remove("visible"), 2200);
}

// -----------------------------------------------------------------------------
// INICIO
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("lista-profesionales");
  const selectEspecialidad = document.getElementById("buscar-especialidad");
  const btnBuscar = document.getElementById("btn-buscar-turnos");

  function renderizarProfesionales() {
    const especialidad = selectEspecialidad.value; // "" = todas
    const favoritos = obtenerFavoritos();

    const filtrados = PROFESIONALES.filter(
      (p) => especialidad === "" || p.especialidad === especialidad
    );

    if (filtrados.length === 0) {
      lista.innerHTML = `<p>No hay profesionales disponibles para esta especialidad.</p>`;
      return;
    }

    lista.innerHTML = filtrados
      .map((p) => {
        const esFav = favoritos.includes(p.id);
        return `
          <article class="card-turno">
            <h3>${p.nombre}</h3>
            <p>${p.nombreEsp}</p>

            <div class="card-turno-datos">
              <p>Próximo turno: ${p.proximo}</p>
              <p>${p.consultorio}</p>
            </div>

            <button type="button"
                    class="button-favorito ${esFav ? "activo" : ""}"
                    data-id="${p.id}"
                    aria-label="${esFav ? "Quitar de favoritos" : "Agregar a favoritos"}"
                    aria-pressed="${esFav}">${esFav ? "♥" : "♡"}</button>

            <a href="solicitarturnos.html?profesional=${p.id}" class="button-vista">
              Ver turnos
            </a>
          </article>
        `;
      })
      .join("");
  }

  selectEspecialidad.addEventListener("change", renderizarProfesionales);
  btnBuscar.addEventListener("click", renderizarProfesionales);

  lista.addEventListener("click", (e) => {
    const btn = e.target.closest(".button-favorito");
    if (!btn) return;

    const esFav = toggleFavorito(Number(btn.dataset.id));
    btn.classList.toggle("activo", esFav);
    btn.textContent = esFav ? "♥" : "♡";
    btn.setAttribute("aria-pressed", esFav);
    btn.setAttribute("aria-label", esFav ? "Quitar de favoritos" : "Agregar a favoritos");
  });

  renderizarProfesionales();
});

// FUNCIONALIDAD PARA BOTONES DE VISTA EN TARJETA O LISTA

const contenedorProfesionales = document.getElementById('lista-profesionales');
const botonesVista = document.querySelectorAll('.selector-vista [data-vista]');

if (contenedorProfesionales && botonesVista.length) {
    function aplicarVista(vista) {
        contenedorProfesionales.classList.toggle('vista-lista', vista === 'lista');
        botonesVista.forEach(boton => {
            boton.classList.toggle('activo', boton.dataset.vista === vista);
        });
        try {
            localStorage.setItem('vistaProfesionales', vista);
        } catch (e) {}
    }

    botonesVista.forEach(boton => {
        boton.addEventListener('click', () => aplicarVista(boton.dataset.vista));
    });

    let guardada = 'tarjetas';
    try {
        guardada = localStorage.getItem('vistaProfesionales') || 'tarjetas';
    } catch (e) {}
    aplicarVista(guardada);
}