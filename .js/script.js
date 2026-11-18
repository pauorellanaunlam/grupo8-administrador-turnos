const botonTema = document.getElementById("boton-tema");

botonTema.addEventListener("click", function() {

    document.body.classList.toggle("modo-oscuro");

    if (document.body.classList.contains("modo-oscuro")) {
        botonTema.textContent = "☀️";
    } else {
        botonTema.textContent = "🌙";
    }

});


//pagina mis turnos

document.addEventListener("DOMContentLoaded", () => {
    const agendaListado = document.querySelector(".agenda-listado");
    const historialTurnos = document.querySelector(".historial-turnos");
    const contadorAgenda = document.querySelector(".agenda-total");
    const contadorHistorial = document.querySelector(".historial-total");

    function actualizarContadores() {
        if (agendaListado && contadorAgenda) {
            const totalAgenda = agendaListado.querySelectorAll(".agenda-item").length;
            const texto = totalAgenda === 1 ? "próximo turno" : "próximos turnos";
            contadorAgenda.textContent = `${String(totalAgenda).padStart(2, "0")} ${texto}`;
        }

        if (historialTurnos && contadorHistorial) {
            const totalHistorial = historialTurnos.querySelectorAll(".historial-registro").length;
            const texto = totalHistorial === 1 ? "registro" : "registros";
            contadorHistorial.textContent = `${String(totalHistorial).padStart(2, "0")} ${texto}`;
        }
    }

    function agregarAHistorial(turno) {
        if (!historialTurnos) return;

        const registro = document.createElement("div");
        registro.className = "historial-registro";
        registro.style.marginTop = "12px";

        registro.innerHTML = `
            <div class="historial-fecha">
                <strong>${turno.diaNumero}</strong>
                <span>${turno.mesCorto}</span>
            </div>

            <div class="historial-detalle">
                <strong>${turno.profesional}</strong>
                <span>${turno.especialidad} · ${turno.descripcion}</span>
            </div>

            <span class="estado-cancelado">Cancelado</span>

            <a href="solicitarturnos.html">
                Volver a solicitar →
            </a>
        `;

        historialTurnos.appendChild(registro);
    }
    const botonesCancelar = document.querySelectorAll(".button-cancelar-turno");

    botonesCancelar.forEach(boton => {
        boton.addEventListener("click", () => {
            const tarjeta = boton.closest(".agenda-item");
            if (!confirm("¿Querés cancelar este turno?")) return;

            const turnoCancelado = {
                diaNumero: tarjeta.querySelector(".agenda-calendario strong").textContent.trim(),
                mesCorto: tarjeta.querySelector(".agenda-calendario small").textContent.trim(),
                especialidad: tarjeta.querySelector(".agenda-categoria").textContent.trim(),
                profesional: tarjeta.querySelector(".agenda-descripcion h3").textContent.trim(),
                descripcion: tarjeta.querySelector(".agenda-descripcion p").textContent.trim()
            };

            tarjeta.remove();
            agregarAHistorial(turnoCancelado);
            actualizarContadores();
        });
    });
    const turnosGuardados = JSON.parse(localStorage.getItem("turnosUsuario")) || [];
    
    if (agendaListado && turnosGuardados.length > 0) {
        turnosGuardados.forEach((turno, index) => {
            const articulo = document.createElement("article");
            articulo.className = "agenda-item";
            
            const partesFecha = turno.fecha ? turno.fecha.split(" de ") : ["16", "noviembre"];
            const diaNum = partesFecha[0] ? partesFecha[0].padStart(2, "0") : "16";
            const mesStr = partesFecha[1] ? partesFecha[1].substring(0, 3).toUpperCase() : "NOV";

            articulo.innerHTML = `
                <div class="agenda-calendario">
                    <span>TUR</span>
                    <strong>${diaNum}</strong>
                    <small>${mesStr}</small>
                </div>

                <div class="agenda-descripcion">
                    <span class="agenda-categoria">${turno.especialidad}</span>
                    <h3>${turno.profesional}</h3>
                    <p>Atención médica</p>
                </div>

                <div class="agenda-horario">
                    <span>HORARIO</span>
                    <strong>${turno.horario}</strong>
                </div>

                <div class="agenda-consultorio">
                    <span>UBICACIÓN</span>
                    <strong>${turno.consultorio}</strong>
                </div>

                <div class="agenda-estado">
                    <span class="estado-confirmado">Confirmado</span>
                    <button type="button" class="button-cancelar-turno">
                        Cancelar
                    </button>
                </div>
            `;

            agendaListado.appendChild(articulo);

            const btnNuevoCancel = articulo.querySelector(".button-cancelar-turno");
            btnNuevoCancel.addEventListener("click", () => {
                if (!confirm("¿Querés cancelar este turno?")) return;

                articulo.remove();
                agregarAHistorial({
                    diaNumero: diaNum,
                    mesCorto: mesStr,
                    especialidad: turno.especialidad,
                    profesional: turno.profesional,
                    descripcion: "Atención médica"
                });
                actualizarContadores();

                turnosGuardados.splice(index, 1);
                localStorage.setItem("turnosUsuario", JSON.stringify(turnosGuardados));
            });
        });

        actualizarContadores();
    }
});

