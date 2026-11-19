// pagina solicitar turnos

(function () {
  "use strict";

  const CLAVE_RESERVADOS = "admin_turnosReservados_v2";
  const CLAVE_PERFIL = "datosPerfil";
  const PACIENTE_ACTUAL_ID = "paciente-actual";

  const MESES_ISO = {
    ENE: "01", FEB: "02", MAR: "03", ABR: "04", MAY: "05", JUN: "06",
    JUL: "07", AGO: "08", SEP: "09", OCT: "10", NOV: "11", DIC: "12"
  };

  const MESES_LARGO = {
    "01": "enero", "02": "febrero", "03": "marzo", "04": "abril",
    "05": "mayo", "06": "junio", "07": "julio", "08": "agosto",
    "09": "septiembre", "10": "octubre", "11": "noviembre", "12": "diciembre"
  };

  const contenedorPrincipal = document.querySelector(".pagina-solicitar");
  if (!contenedorPrincipal) return;

  const datosResumen = document.querySelectorAll(".resumen-turno .resumen-dato strong");
  const resumenEspecialidad = datosResumen[0] || null;
  const resumenProfesional = datosResumen[1] || null;
  const resumenFecha = datosResumen[2] || null;
  const resumenHorario = datosResumen[3] || null;

  const ubicacionTitulo = document.querySelector(".resumen-ubicacion strong");
  const ubicacionSubtitulo = document.querySelector(".resumen-ubicacion small");
  const botonConfirmar = document.querySelector(".btn-confirmar");
  const pasos = document.querySelectorAll(".pasos-solicitud .paso");

  function obtenerEspecialidadSeleccionada() {
    const marcado = document.querySelector('input[name="especialidad"]:checked');
    const texto = marcado?.closest(".especialidad-opcion")?.querySelector("strong")?.textContent.trim();
    return texto || "Cardiología";
  }

  function obtenerProfesionalSeleccionado() {
    const marcado = document.querySelector('input[name="profesional"]:checked');
    const opcion = marcado?.closest(".profesional-opcion");
    return {
      nombre: opcion?.querySelector(".datos-profesional strong")?.textContent.trim() || "Dra. Laura Martínez",
      especialidad: opcion?.querySelector(".datos-profesional span")?.textContent.trim() || obtenerEspecialidadSeleccionada(),
      modalidad: opcion?.querySelector(".datos-profesional small")?.textContent.trim() || "Atención presencial"
    };
  }

  function obtenerFechaSeleccionada() {
    const marcado = document.querySelector('input[name="fecha"]:checked');
    const opcion = marcado?.closest(".fecha-opcion");
    const diaRaw = opcion?.querySelector(".fecha-card strong")?.textContent.trim() || "16";
    const mesRaw = (opcion?.querySelector(".fecha-card span")?.textContent.trim() || "Nov").toUpperCase();

    const diaDosDigitos = diaRaw.padStart(2, "0");
    const mesDosDigitos = MESES_ISO[mesRaw] || "11";
    const fechaISO = `2026-${mesDosDigitos}-${diaDosDigitos}`;
    const textoLegible = `${Number(diaRaw)} de ${MESES_LARGO[mesDosDigitos] || "noviembre"}`;

    return { fechaISO, textoLegible };
  }

  function obtenerHorarioSeleccionado() {
    const marcado = document.querySelector('input[name="horario"]:checked');
    return marcado?.closest(".horario-opcion")?.querySelector("span")?.textContent.trim() || "09:00";
  }

  function actualizarPasos(pasoActivoIndex) {
    pasos.forEach((paso, idx) => {
      paso.classList.toggle("activo", idx <= pasoActivoIndex);
    });
  }

  function actualizarResumen(pasoActivoIndex = 0) {
    const especialidad = obtenerEspecialidadSeleccionada();
    const profesional = obtenerProfesionalSeleccionado();
    const fecha = obtenerFechaSeleccionada();
    const horario = obtenerHorarioSeleccionado();

    if (resumenEspecialidad) resumenEspecialidad.textContent = especialidad;
    if (resumenProfesional) resumenProfesional.textContent = profesional.nombre;
    if (resumenFecha) resumenFecha.textContent = fecha.textoLegible;
    if (resumenHorario) resumenHorario.textContent = `${horario} hs`;

    if (ubicacionTitulo) {
      ubicacionTitulo.textContent = profesional.modalidad;
    }
    if (ubicacionSubtitulo) {
      ubicacionSubtitulo.textContent = "Centro Médico Turnos Salud · Consultorio 204";
    }

    actualizarPasos(pasoActivoIndex);
  }

  document.querySelectorAll('input[name="especialidad"]').forEach((input) => {
    input.addEventListener("change", () => actualizarResumen(0));
  });

  document.querySelectorAll('input[name="profesional"]').forEach((input) => {
    input.addEventListener("change", () => actualizarResumen(1));
  });

  document.querySelectorAll('input[name="fecha"], input[name="horario"]').forEach((input) => {
    input.addEventListener("change", () => actualizarResumen(2));
  });
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

  function obtenerNombrePaciente() {
    try {
      const perfil = JSON.parse(localStorage.getItem(CLAVE_PERFIL));
      if (perfil && perfil.nombre) return perfil.nombre;
    } catch {}
    return "María Pérez";
  }

  if (botonConfirmar) {
    botonConfirmar.addEventListener("click", () => {
      const especialidad = obtenerEspecialidadSeleccionada();
      const profesional = obtenerProfesionalSeleccionado();
      const fecha = obtenerFechaSeleccionada();
      const horario = obtenerHorarioSeleccionado();

      const nuevaReserva = {
        id: Date.now(),
        especialidad,
        profesional: profesional.nombre,
        fecha: fecha.fechaISO,
        hora: horario,
        sede: "Centro Médico Turnos Salud",
        comentario: "Consultorio 204",
        paciente: obtenerNombrePaciente(),
        reservadoPor: PACIENTE_ACTUAL_ID,
        reservadoEl: new Date().toLocaleString()
      };

      const reservados = leerLista(CLAVE_RESERVADOS);
      reservados.unshift(nuevaReserva);
      guardarLista(CLAVE_RESERVADOS, reservados);

      alert(
        `¡Turno confirmado!\n\n` +
        `Profesional: ${nuevaReserva.profesional}\n` +
        `Especialidad: ${nuevaReserva.especialidad}\n` +
        `Fecha: ${fecha.textoLegible}\n` +
        `Horario: ${nuevaReserva.hora} hs`
      );

      if (confirm("¿Querés ir a 'Mis turnos' para ver tu reserva?")) {
        window.location.href = "misturnos.html";
      }
    });
  }
  actualizarResumen(0);
})();