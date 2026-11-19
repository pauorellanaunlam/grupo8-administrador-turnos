/**
 * =============================================================================
 * misturnos.html
 * Muestra las reservas hechas por el paciente en usuario.html.
 * - Próxima consulta (destacada) + agenda con el resto de los turnos
 * - Historial: turnos cancelados y turnos que ya pasaron
 * - Cancelar: mueve el turno de "reservados" a "cancelados" (lo ve admin.html)
 * =============================================================================
 */
(function () {
  "use strict";

  // Claves compartidas con admin.js, usuario.js y miperfil.js
  const CLAVE_RESERVADOS = "admin_turnosReservados_v2";
  const CLAVE_CANCELADOS = "admin_turnosCancelados_v2";
  const PACIENTE_ACTUAL_ID = "paciente-actual";

  const saludo = document.getElementById("saludo-mis-turnos");
  const contenedorDestacado = document.getElementById("turno-destacado");
  const listaAgenda = document.getElementById("agenda-listado");
  const totalAgenda = document.getElementById("agenda-total");
  const mesAgenda = document.getElementById("agenda-mes");
  const listaHistorial = document.getElementById("historial-listado");
  const totalHistorial = document.getElementById("historial-total");

  if (!contenedorDestacado || !listaAgenda || !listaHistorial) {
    console.error("[misturnos.js] Faltan contenedores en misturnos.html");
    return;
  }

  // ---------------------------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------------------------
  function leerLista(clave) {
    try {
      const lista = JSON.parse(localStorage.getItem(clave));
      return Array.isArray(lista) ? lista : [];
    } catch (err) {
      return [];
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

  function hoyISO() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  function fechaLocal(fechaISO) {
    return new Date(fechaISO + "T00:00:00");
  }

  function textoFecha(fechaISO, opciones) {
    return fechaLocal(fechaISO)
      .toLocaleDateString("es-AR", opciones)
      .replace(".", "")
      .toUpperCase();
  }

  function dosDigitos(numero) {
    return String(numero).padStart(2, "0");
  }

  function iniciales(nombre) {
    return nombre
      .replace("Dra. ", "")
      .replace("Dr. ", "")
      .split(" ")
      .map((palabra) => palabra[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function ubicacion(turno) {
    return turno.comentario ? `${turno.sede} · ${turno.comentario}` : turno.sede;
  }

  function primerNombrePaciente() {
    try {
      const datos = JSON.parse(localStorage.getItem("datosPerfil"));
      if (datos && datos.nombre) return datos.nombre.split(" ")[0];
    } catch (err) {}
    return "María";
  }

  function diasHasta(fechaISO) {
    const hoy = fechaLocal(hoyISO());
    return Math.round((fechaLocal(fechaISO) - hoy) / 86400000);
  }

  function frasePlazo(fechaISO) {
    const dias = diasHasta(fechaISO);
    if (dias === 0) return "Tu consulta es<br>hoy.";
    if (dias === 1) return "Tu consulta es<br>mañana.";
    return `Tu consulta es<br>en ${dias} días.`;
  }

  // ---------------------------------------------------------------------------
  // DATOS
  // ---------------------------------------------------------------------------
  function obtenerDatos() {
    const hoy = hoyISO();
    const ordenar = (a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora);

    const reservados = leerLista(CLAVE_RESERVADOS).filter(
      (t) => t.reservadoPor === PACIENTE_ACTUAL_ID
    );
    const cancelados = leerLista(CLAVE_CANCELADOS).filter(
      (t) => t.reservadoPor === PACIENTE_ACTUAL_ID
    );

    const proximos = reservados.filter((t) => t.fecha >= hoy).sort(ordenar);

    const historial = [
      ...cancelados.map((t) => ({ ...t, estado: "cancelado" })),
      ...reservados.filter((t) => t.fecha < hoy).map((t) => ({ ...t, estado: "finalizado" }))
    ].sort((a, b) => ordenar(b, a));

    return { proximos, historial };
  }

  function cancelarTurno(id) {
    const reservados = leerLista(CLAVE_RESERVADOS);
    const indice = reservados.findIndex(
      (t) => t.id === id && t.reservadoPor === PACIENTE_ACTUAL_ID
    );
    if (indice === -1) return;

    const turno = reservados.splice(indice, 1)[0];
    const cancelados = leerLista(CLAVE_CANCELADOS);

    cancelados.unshift({
      ...turno,
      canceladoEl: new Date().toLocaleString(),
      canceladoPor: "paciente"
    });

    guardarLista(CLAVE_RESERVADOS, reservados);
    guardarLista(CLAVE_CANCELADOS, cancelados);
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  function htmlDestacado(t, total) {
    const dia = fechaLocal(t.fecha).getDate();

    return `
      <div class="turno-destacado">
        <div class="destacado-principal">

          <div class="destacado-superior">
            <span class="destacado-indicador"><span></span> TU PRÓXIMA CONSULTA</span>
            <span class="destacado-numero">01 / ${dosDigitos(total)}</span>
          </div>

          <div class="destacado-fecha">
            <div class="fecha-bloque">
              <span>${textoFecha(t.fecha, { weekday: "long" })}</span>
              <strong>${dia}</strong>
              <span>${textoFecha(t.fecha, { month: "long", year: "numeric" }).replace(" DE ", " ")}</span>
            </div>

            <div class="fecha-descripcion">
              <span>${escapar(t.hora)} HS</span>
              <h2>${frasePlazo(t.fecha)}</h2>
              <p>Tené a mano los detalles de tu consulta.</p>
            </div>
          </div>

          <div class="destacado-medico">
            <div class="avatar-medico">${escapar(iniciales(t.profesional))}</div>
            <div>
              <strong>${escapar(t.profesional)}</strong>
              <span>${escapar(t.especialidad)}</span>
            </div>
            <span class="estado-confirmado">Confirmado</span>
            <button type="button" class="button-cancelar-turno" data-id="${t.id}">Cancelar</button>
          </div>

        </div>

        <aside class="destacado-lateral">
          <div class="lateral-icono"><span>✚</span></div>
          <span class="lateral-etiqueta">DETALLES DE LA VISITA</span>

          <div class="lateral-dato">
            <span>HORARIO</span>
            <strong>${escapar(t.hora)} hs</strong>
          </div>

          <div class="lateral-dato">
            <span>UBICACIÓN</span>
            <strong>${escapar(ubicacion(t))}</strong>
          </div>

          <div class="lateral-dato">
            <span>ESPECIALIDAD</span>
            <strong>${escapar(t.especialidad)}</strong>
          </div>

          <div class="lateral-mensaje">Recordá llegar unos minutos antes de tu turno.</div>
        </aside>
      </div>
    `;
  }

  function htmlVacio() {
    return `
      <div class="mis-turnos-vacio">
        <h2>Todavía no tenés turnos reservados</h2>
        <p>Buscá un profesional y reservá tu primera consulta.</p>
        <a href="usuario.html" class="btn-nuevo-turno"><span>+</span> Buscar turnos</a>
      </div>
    `;
  }

  function htmlAgendaItem(t) {
    return `
      <article class="agenda-item">
        <div class="agenda-calendario">
          <span>${textoFecha(t.fecha, { weekday: "short" })}</span>
          <strong>${fechaLocal(t.fecha).getDate()}</strong>
          <small>${textoFecha(t.fecha, { month: "short" })}</small>
        </div>

        <div class="agenda-descripcion">
          <span class="agenda-categoria">${escapar(t.especialidad.toUpperCase())}</span>
          <h3>${escapar(t.profesional)}</h3>
          <p>Atención médica</p>
        </div>

        <div class="agenda-horario">
          <span>HORARIO</span>
          <strong>${escapar(t.hora)} hs</strong>
        </div>

        <div class="agenda-consultorio">
          <span>UBICACIÓN</span>
          <strong>${escapar(ubicacion(t))}</strong>
        </div>

        <div class="agenda-estado">
          <span class="estado-confirmado">Confirmado</span>
          <button type="button" class="button-cancelar-turno" data-id="${t.id}">Cancelar</button>
        </div>
      </article>
    `;
  }

  function htmlHistorialItem(t) {
    const cancelado = t.estado === "cancelado";
    return `
      <div class="historial-registro">
        <div class="historial-fecha">
          <strong>${fechaLocal(t.fecha).getDate()}</strong>
          <span>${textoFecha(t.fecha, { month: "short" })}</span>
        </div>

        <div class="historial-detalle">
          <strong>${escapar(t.profesional)}</strong>
          <span>${escapar(t.especialidad)} · ${escapar(ubicacion(t))}</span>
        </div>

        <span class="${cancelado ? "estado-cancelado" : "estado-finalizado"}">
          ${cancelado ? "Cancelado" : "Finalizado"}
        </span>

        <a href="usuario.html">Volver a solicitar →</a>
      </div>
    `;
  }

  function renderizar() {
    const { proximos, historial } = obtenerDatos();
    const resto = proximos.slice(1);

    if (saludo) {
      saludo.textContent = `Hola, ${primerNombrePaciente()}. Estos son tus próximos compromisos de salud.`;
    }

    contenedorDestacado.innerHTML =
      proximos.length > 0 ? htmlDestacado(proximos[0], proximos.length) : htmlVacio();

    listaAgenda.innerHTML =
      resto.length > 0
        ? resto.map(htmlAgendaItem).join("")
        : `<p class="mensaje-vacio">No tenés otras consultas programadas.</p>`;

    if (totalAgenda) {
      totalAgenda.textContent = `${dosDigitos(resto.length)} ${resto.length === 1 ? "próximo turno" : "próximos turnos"}`;
    }

    if (mesAgenda) {
      mesAgenda.textContent = textoFecha(hoyISO(), { month: "long", year: "numeric" }).replace(" DE ", " ");
    }

    listaHistorial.innerHTML =
      historial.length > 0
        ? historial.map(htmlHistorialItem).join("")
        : `<p class="mensaje-vacio">Todavía no hay actividad para mostrar.</p>`;

    if (totalHistorial) {
      totalHistorial.textContent = `${dosDigitos(historial.length)} ${historial.length === 1 ? "registro" : "registros"}`;
    }
  }

  // ---------------------------------------------------------------------------
  // EVENTOS
  // ---------------------------------------------------------------------------
  document.addEventListener("click", (e) => {
    const boton = e.target.closest(".button-cancelar-turno");
    if (!boton) return;

    if (!confirm("¿Querés cancelar este turno?")) return;

    cancelarTurno(Number(boton.dataset.id));
    renderizar();
  });

  // Si el admin cancela un turno o se reserva desde otra pestaña, se actualiza solo
  window.addEventListener("storage", renderizar);

  renderizar();
})();