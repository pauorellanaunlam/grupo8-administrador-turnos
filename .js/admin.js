(function () {
  "use strict";

  const CLAVE_PUBLICADOS = "admin_turnosPublicados_v2";
  const CLAVE_RESERVADOS = "admin_turnosReservados_v2";
  const CLAVE_CANCELADOS = "admin_turnosCancelados_v2";

  const ids = [
    "form-crear-turno", "profesional", "especialidad", "fecha", "hora",
    "sede", "comentario", "lista-publicados", "lista-reservados", "lista-cancelados"
  ];

  const faltantes = ids.filter((id) => !document.getElementById(id));
  if (faltantes.length > 0) {
    console.error("[admin.js] Faltan estos ids en admin.html:", faltantes.join(", "));
    return;
  }

  const form = document.getElementById("form-crear-turno");
  const inputProfesional = document.getElementById("profesional");
  const selectEspecialidad = document.getElementById("especialidad");
  const inputFecha = document.getElementById("fecha");
  const inputHora = document.getElementById("hora");
  const selectSede = document.getElementById("sede");
  const inputComentario = document.getElementById("comentario");

  const listaPublicados = document.getElementById("lista-publicados");
  const listaReservados = document.getElementById("lista-reservados");
  const listaCancelados = document.getElementById("lista-cancelados");

  const camposObligatorios = [
    inputProfesional,
    selectEspecialidad,
    inputFecha,
    inputHora,
    selectSede
  ];


  const PUBLICADOS_INICIALES = [
    { id: 1, especialidad: "Clínica médica", profesional: "Dra. María González", fecha: "2026-11-23", hora: "09:30", sede: "Sede Lugano", comentario: "Consultorio 1" },
    { id: 2, especialidad: "Cardiología", profesional: "Dr. Carlos Ramírez", fecha: "2026-11-24", hora: "11:00", sede: "Sede Ramos Mejía", comentario: "Consultorio 3" },
  ];

  const RESERVADOS_INICIALES = [
    { id: 101, especialidad: "Clínica médica", profesional: "Dra. María González", fecha: "2026-11-18", hora: "10:00", sede: "Sede Lugano", comentario: "Consultorio 1", paciente: "Juan Pérez" },
    { id: 102, especialidad: "Cardiología", profesional: "Dr. Carlos Ramírez", fecha: "2026-11-20", hora: "11:30", sede: "Sede Ramos Mejía", comentario: "Consultorio 3", paciente: "Ana Rodríguez" },
    { id: 103, especialidad: "Dermatología", profesional: "Dra. Laura Medina", fecha: "2026-11-25", hora: "15:00", sede: "Consulta virtual", comentario: "", paciente: "Lucía Méndez" },
    { id: 104, especialidad: "Clínica médica", profesional: "Dr. Martín Acosta", fecha: "2026-11-27", hora: "09:00", sede: "Sede San Isidro", comentario: "Consultorio 2", paciente: "Diego Fernández" }
  ];

  // ---------------------------------------------------------------------------

  function cargarLista(clave, valorInicial) {
    const raw = localStorage.getItem(clave);
    if (raw === null) return valorInicial.slice(); // primera vez: usamos los predeterminados
    try {
      const lista = JSON.parse(raw);
      return Array.isArray(lista) ? lista : valorInicial.slice();
    } catch {
      return valorInicial.slice();
    }
  }

  function guardarLista(clave, lista) {
    localStorage.setItem(clave, JSON.stringify(lista));
  }

  let publicados = cargarLista(CLAVE_PUBLICADOS, PUBLICADOS_INICIALES);
  let reservados = cargarLista(CLAVE_RESERVADOS, RESERVADOS_INICIALES);
  let cancelados = cargarLista(CLAVE_CANCELADOS, []);

  /** Convierte "2026-11-23" en "23/11/2026" */
  function formatearFecha(fechaISO) {
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
  }

  /** Fecha de hoy en formato "AAAA-MM-DD" (hora local) */
  function hoyISO() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  /** Evita que lo que escribe el admin se interprete como HTML */
  function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  function validarCampo(input) {
    const valor = input.value.trim();

    if (valor === "") {
      return { esValido: false, mensaje: "Este campo es obligatorio." };
    }

    if (input.id === "fecha" && valor < hoyISO()) {
      return { esValido: false, mensaje: "La fecha no puede ser anterior a hoy." };
    }

    return { esValido: true, mensaje: "" };
  }

  function aplicarEstilosValidacion(input, esValido, mensaje) {
    const errorElement = document.getElementById(`error-${input.id}`);

    if (esValido) {
      input.classList.remove("admin-input-invalido");
      input.classList.add("admin-input-valido");
      if (errorElement) errorElement.textContent = "";
    } else {
      input.classList.remove("admin-input-valido");
      input.classList.add("admin-input-invalido");
      if (errorElement) errorElement.textContent = mensaje;
    }
  }

  camposObligatorios.forEach((campo) => {
    ["input", "blur"].forEach((tipoEvento) => {
      campo.addEventListener(tipoEvento, () => {
        const res = validarCampo(campo);
        aplicarEstilosValidacion(campo, res.esValido, res.mensaje);
      });
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let todoEsValido = true;

    camposObligatorios.forEach((campo) => {
      const res = validarCampo(campo);
      aplicarEstilosValidacion(campo, res.esValido, res.mensaje);
      if (!res.esValido) todoEsValido = false;
    });

    if (!todoEsValido) return;

    const nuevoTurno = {
      id: Date.now(), // id único simple
      // Guardamos el TEXTO visible de los <select> (ej: "Cardiología"), no el value
      especialidad: selectEspecialidad.options[selectEspecialidad.selectedIndex].text,
      profesional: inputProfesional.value.trim(),
      fecha: inputFecha.value,
      hora: inputHora.value,
      sede: selectSede.options[selectSede.selectedIndex].text,
      comentario: inputComentario.value.trim()
    };

    publicados.unshift(nuevoTurno); // arriba de todo
    guardarLista(CLAVE_PUBLICADOS, publicados);

    form.reset();
    camposObligatorios.forEach((campo) => {
      campo.classList.remove("admin-input-valido", "admin-input-invalido");
    });

    renderizarTodo();
  });

  listaPublicados.addEventListener("click", (e) => {
    const boton = e.target.closest(".card-turno-admin-boton-eliminar");
    if (!boton) return;

    const id = Number(boton.closest(".card-turno-admin").dataset.id);

    if (confirm("¿Seguro que querés eliminar este turno?")) {
      publicados = publicados.filter((t) => t.id !== id);
      guardarLista(CLAVE_PUBLICADOS, publicados);
      renderizarTodo();
    }
  });

  listaReservados.addEventListener("click", (e) => {
    const boton = e.target.closest(".card-turno-admin-boton-cancelar");
    if (!boton) return;

    const id = Number(boton.closest(".card-turno-admin").dataset.id);
    const turno = reservados.find((t) => t.id === id);
    if (!turno) return;

    if (confirm(`¿Cancelar el turno de ${turno.paciente}?`)) {
      reservados = reservados.filter((t) => t.id !== id);
      turno.canceladoEl = new Date().toLocaleString();
      cancelados.unshift(turno);

      guardarLista(CLAVE_RESERVADOS, reservados);
      guardarLista(CLAVE_CANCELADOS, cancelados);
      renderizarTodo();
    }
  });

  function detalleSede(t) {
    return t.comentario
      ? `${escapar(t.sede)} · ${escapar(t.comentario)}`
      : escapar(t.sede);
  }

  function tarjetaBase(t, extra, boton, claseExtra = "") {
    return `
      <article class="card-turno-admin ${claseExtra}" data-id="${t.id}">
        <h3 class="card-turno-admin-titulo">${escapar(t.especialidad)}</h3>
        <p class="card-turno-admin-texto">${escapar(t.profesional)}</p>
        <p class="card-turno-admin-texto">${formatearFecha(t.fecha)} · ${t.hora} hs</p>
        <p class="card-turno-admin-texto">${detalleSede(t)}</p>
        ${extra}
        ${boton}
      </article>
    `;
  }

  function mensajeVacio(texto) {
    return `<p class="admin-mensaje-vacio">${texto}</p>`;
  }

  function renderizarTodo() {
    listaPublicados.innerHTML = publicados.length
      ? publicados
          .map((t) =>
            tarjetaBase(
              t,
              "",
              `<button type="button" class="card-turno-admin-boton card-turno-admin-boton-eliminar">Eliminar</button>`
            )
          )
          .join("")
      : mensajeVacio("No hay turnos publicados.");

    listaReservados.innerHTML = reservados.length
      ? reservados
          .map((t) =>
            tarjetaBase(
              t,
              `<p class="card-turno-admin-texto">Paciente: ${escapar(t.paciente)}</p>`,
              `<button type="button" class="card-turno-admin-boton card-turno-admin-boton-cancelar">Cancelar turno</button>`
            )
          )
          .join("")
      : mensajeVacio("No hay turnos reservados.");

    listaCancelados.innerHTML = cancelados.length
      ? cancelados
          .map((t) =>
            tarjetaBase(
              t,
              `<p class="card-turno-admin-texto">Paciente: ${escapar(t.paciente)}</p>
               <p class="card-turno-admin-texto"><small>Cancelado el ${escapar(t.canceladoEl)}</small></p>`,
              "",
              "card-turno-admin-cancelado"
            )
          )
          .join("")
      : mensajeVacio("No hay turnos cancelados.");
  }

  // Si un paciente reserva desde usuario.html (otra pestaña), se actualiza solo
  window.addEventListener("storage", () => {
    publicados = cargarLista(CLAVE_PUBLICADOS, PUBLICADOS_INICIALES);
    reservados = cargarLista(CLAVE_RESERVADOS, RESERVADOS_INICIALES);
    cancelados = cargarLista(CLAVE_CANCELADOS, []);
    renderizarTodo();
  });

  inputFecha.min = hoyISO();
  renderizarTodo();
})();