// Página solicitar turnos: el usuario elige entre los turnos que publicó el administrador

(function () {
  "use strict";

  const CLAVE_PUBLICADOS = "admin_turnosPublicados_v2";
  const CLAVE_RESERVADOS = "admin_turnosReservados_v2";
  const KEY_SESION = "usuarioActivo"; // la guarda el login (index)
  const RUTA_LOGIN = "../index.html";
  const RUTA_MIS_TURNOS = "misturnos.html";

  const contenedorPrincipal = document.querySelector(".pagina-solicitar");
  if (!contenedorPrincipal) return;

  // ---------- Sesión: solo pueden entrar usuarios logueados ----------
  let sesion = null;
  try {
    sesion = JSON.parse(sessionStorage.getItem(KEY_SESION));
  } catch {
    sesion = null;
  }
  if (!sesion) {
    window.location.href = RUTA_LOGIN;
    return;
  }

  // ---------- Elementos del DOM ----------
  const gridEspecialidades = document.querySelector(".especialidades-grid");
  const gridProfesionales = document.querySelector(".profesionales-grid");
  const gridFechas = document.querySelector(".fechas-disponibles");
  const gridHorarios = document.querySelector(".horarios-grid");
  const contenido = document.querySelector(".contenido-solicitud");

  const datosResumen = document.querySelectorAll(".resumen-turno .resumen-dato strong");
  const ubicacionTitulo = document.querySelector(".resumen-ubicacion strong");
  const ubicacionSubtitulo = document.querySelector(".resumen-ubicacion small");
  const etiquetaModalidad = document.querySelector(".resumen-imagen span");
  const botonConfirmar = document.querySelector(".btn-confirmar");
  const pasos = document.querySelectorAll(".pasos-solicitud .paso");

  // ---------- Datos de apoyo ----------
  const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const MESES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const MESES_LARGO = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const INFO_ESPECIALIDAD = {
    "Cardiología": { icono: "❤︎", detalle: "Corazón y circulación" },
    "Clínica médica": { icono: "👨🏼‍⚕️", detalle: "Atención general" },
    "Dermatología": { icono: "✿", detalle: "Salud de la piel" },
    "Odontología": { icono: "🦷", detalle: "Salud bucal" }
  };
  const INFO_POR_DEFECTO = { icono: "✚", detalle: "Atención médica" };

  // ---------- Utilidades ----------
  function leerLista(clave) {
    try {
      const lista = JSON.parse(localStorage.getItem(clave));
      return Array.isArray(lista) ? lista : [];
    } catch {
      return [];
    }
  }

  function guardarLista(clave, lista) {
    localStorage.setItem(clave, JSON.stringify(lista));
  }

  // Evita que lo que escribió el admin se interprete como HTML
  function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function partesFecha(iso) {
    const [anio, mes, dia] = iso.split("-").map(Number);
    return { anio, mes, dia, fecha: new Date(anio, mes - 1, dia) };
  }

  function textoLegible(iso) {
    const p = partesFecha(iso);
    return `${p.dia} de ${MESES_LARGO[p.mes - 1]}`;
  }

  function unicos(lista) {
    return [...new Set(lista)];
  }

  // Si el valor actual sigue disponible lo mantiene; si no, toma el primero
  function elegirValido(actual, opciones) {
    if (opciones.includes(actual)) return actual;
    return opciones.length ? opciones[0] : null;
  }

  // ---------- Estado ----------
  let disponibles = [];
  let pasoActivo = 0;
  const estado = { especialidad: null, profesional: null, fecha: null, turnoId: null };

  // Turnos publicados por el admin que todavía no pasaron
  function cargarDisponibles() {
    const ahora = new Date();
    return leerLista(CLAVE_PUBLICADOS)
      .filter((t) => new Date(`${t.fecha}T${t.hora}`) > ahora)
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  }

  // ---------- Render ----------
  function renderizar() {
    const especialidades = unicos(disponibles.map((t) => t.especialidad));
    estado.especialidad = elegirValido(estado.especialidad, especialidades);

    const delaEspecialidad = disponibles.filter((t) => t.especialidad === estado.especialidad);
    const profesionales = unicos(delaEspecialidad.map((t) => t.profesional));
    estado.profesional = elegirValido(estado.profesional, profesionales);

    const delProfesional = delaEspecialidad.filter((t) => t.profesional === estado.profesional);
    const fechas = unicos(delProfesional.map((t) => t.fecha));
    estado.fecha = elegirValido(estado.fecha, fechas);

    const delDia = delProfesional.filter((t) => t.fecha === estado.fecha);
    estado.turnoId = elegirValido(estado.turnoId, delDia.map((t) => t.id));

    // 1) Especialidades
    gridEspecialidades.innerHTML = especialidades.length
      ? especialidades.map((nombre) => {
          const info = INFO_ESPECIALIDAD[nombre] || INFO_POR_DEFECTO;
          return `
            <label class="especialidad-opcion">
              <input type="radio" name="especialidad" value="${escapar(nombre)}"
                     ${nombre === estado.especialidad ? "checked" : ""}>
              <div class="especialidad-card">
                <span class="icono-especialidad">${info.icono}</span>
                <strong>${escapar(nombre)}</strong>
                <small>${info.detalle}</small>
              </div>
            </label>`;
        }).join("")
      : `<p class="mensaje-sin-turnos">Por el momento no hay turnos publicados. Volvé a intentar más tarde.</p>`;

    // 2) Profesionales
    gridProfesionales.innerHTML = profesionales.map((nombre) => {
      const ejemplo = delaEspecialidad.find((t) => t.profesional === nombre);
      const iniciales = nombre
        .replace(/^(Dr|Dra)\.?\s+/i, "")
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      return `
        <label class="profesional-opcion">
          <input type="radio" name="profesional" value="${escapar(nombre)}"
                 ${nombre === estado.profesional ? "checked" : ""}>
          <div class="profesional-card">
            <div class="avatar-profesional">${escapar(iniciales)}</div>
            <div class="datos-profesional">
              <strong>${escapar(nombre)}</strong>
              <span>${escapar(ejemplo.especialidad)}</span>
              <small>${escapar(ejemplo.sede)}</small>
            </div>
          </div>
        </label>`;
    }).join("");

    // 3) Fechas
    gridFechas.innerHTML = fechas.map((iso) => {
      const p = partesFecha(iso);
      return `
        <label class="fecha-opcion">
          <input type="radio" name="fecha" value="${iso}" ${iso === estado.fecha ? "checked" : ""}>
          <div class="fecha-card">
            <small>${DIAS[p.fecha.getDay()]}</small>
            <strong>${p.dia}</strong>
            <span>${MESES_CORTO[p.mes - 1]}</span>
          </div>
        </label>`;
    }).join("");

    // 4) Horarios
    gridHorarios.innerHTML = delDia.map((t) => `
      <label class="horario-opcion">
        <input type="radio" name="horario" value="${t.id}" ${t.id === estado.turnoId ? "checked" : ""}>
        <span>${escapar(t.hora)}</span>
      </label>`).join("");

    actualizarResumen();
  }

  function actualizarResumen() {
    const turno = disponibles.find((t) => t.id === estado.turnoId) || null;

    if (datosResumen[0]) datosResumen[0].textContent = turno ? turno.especialidad : "—";
    if (datosResumen[1]) datosResumen[1].textContent = turno ? turno.profesional : "—";
    if (datosResumen[2]) datosResumen[2].textContent = turno ? textoLegible(turno.fecha) : "—";
    if (datosResumen[3]) datosResumen[3].textContent = turno ? `${turno.hora} hs` : "—";

    if (ubicacionTitulo) ubicacionTitulo.textContent = turno ? turno.sede : "—";
    if (ubicacionSubtitulo) ubicacionSubtitulo.textContent = turno ? (turno.comentario || "") : "";
    if (etiquetaModalidad) {
      etiquetaModalidad.textContent =
        turno && /virtual/i.test(turno.sede) ? "CONSULTA VIRTUAL" : "ATENCIÓN PRESENCIAL";
    }

    if (botonConfirmar) botonConfirmar.disabled = !turno;

    pasos.forEach((paso, idx) => {
      paso.classList.toggle("activo", idx <= pasoActivo);
    });
  }

  function refrescar() {
    disponibles = cargarDisponibles();
    renderizar();
  }

  // ---------- Eventos ----------
  contenido.addEventListener("change", (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement)) return;

    switch (input.name) {
      case "especialidad":
        estado.especialidad = input.value;
        pasoActivo = 0;
        break;
      case "profesional":
        estado.profesional = input.value;
        pasoActivo = 1;
        break;
      case "fecha":
        estado.fecha = input.value;
        pasoActivo = 2;
        break;
      case "horario":
        estado.turnoId = Number(input.value);
        pasoActivo = 2;
        break;
      default:
        return;
    }
    renderizar();
  });

  if (botonConfirmar) {
    botonConfirmar.addEventListener("click", () => {
      const turnoElegido = disponibles.find((t) => t.id === estado.turnoId);
      if (!turnoElegido) return;

      // Releemos del almacenamiento por si otra persona lo reservó mientras tanto
      const publicadosActuales = leerLista(CLAVE_PUBLICADOS);
      const sigueLibre = publicadosActuales.some((t) => t.id === turnoElegido.id);
      if (!sigueLibre) {
        alert("Ese turno ya no está disponible. Elegí otro, por favor.");
        refrescar();
        return;
      }

      const reservados = leerLista(CLAVE_RESERVADOS);

      // El mismo usuario no puede tener dos turnos a la misma fecha y hora
      const yaTieneEseHorario = reservados.some(
        (r) =>
          String(r.usuarioId) === String(sesion.id) &&
          r.fecha === turnoElegido.fecha &&
          r.hora === turnoElegido.hora
      );
      if (yaTieneEseHorario) {
        alert("Ya tenés un turno reservado en ese mismo día y horario.");
        return;
      }

      const reserva = {
        ...turnoElegido,
        paciente: sesion.nombre,
        pacienteEmail: sesion.email,
        usuarioId: sesion.id,
        reservadoPor: sesion.id,
        reservadoEl: new Date().toLocaleString()
      };

      // El turno pasa de "publicado" a "reservado"
      reservados.unshift(reserva);
      guardarLista(CLAVE_RESERVADOS, reservados);
      guardarLista(
        CLAVE_PUBLICADOS,
        publicadosActuales.filter((t) => t.id !== turnoElegido.id)
      );

      alert(
        `¡Turno confirmado!\n\n` +
        `Profesional: ${reserva.profesional}\n` +
        `Especialidad: ${reserva.especialidad}\n` +
        `Fecha: ${textoLegible(reserva.fecha)}\n` +
        `Horario: ${reserva.hora} hs\n` +
        `Lugar: ${reserva.sede}${reserva.comentario ? " · " + reserva.comentario : ""}`
      );

      if (confirm("¿Querés ir a 'Mis turnos' para ver tu reserva?")) {
        window.location.href = RUTA_MIS_TURNOS;
      } else {
        refrescar();
      }
    });
  }

  // Si el admin publica o alguien reserva en otra pestaña, se actualiza solo
  window.addEventListener("storage", refrescar);

  refrescar();
})();