
document.addEventListener("DOMContentLoaded", () => {
    // 1. CATÁLOGO DE PROFESIONALES

    const catalogoProfesionales = [
        {
            id: 1,
            nombre: "Dra. Laura Martínez",
            especialidad: "Cardiología",
            foto: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300"
        },
        {
            id: 2,
            nombre: "Dr. Martín López",
            especialidad: "Cardiología",
            foto: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300"
        },
        {
            id: 3,
            nombre: "Dra. María González",
            especialidad: "Clínica médica",
            foto: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300"
        },
        {
            id: 4,
            nombre: "Dra. Laura Medina",
            especialidad: "Dermatología",
            foto: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300"
        }
    ];

    // 2. ELEMENTOS DEL HTML

    const especialidades = document.querySelectorAll(
        'input[name="especialidad"]'
    );

    const contenedorProfesionales = document.querySelector(
        ".profesionales-grid"
    );

    const fechas = document.querySelectorAll(
        'input[name="fecha"]'
    );

    const horarios = document.querySelectorAll(
        'input[name="horario"]'
    );

    const botonConfirmar = document.querySelector(".btn-confirmar");

    const resumen = document.querySelectorAll(".resumen-dato strong");

    const resumenEspecialidad = resumen[0];
    const resumenProfesional = resumen[1];
    const resumenFecha = resumen[2];
    const resumenHorario = resumen[3];

    // 3. LOCALSTORAGE

    const CLAVE_TURNOS = "turnos";

    function obtenerTurnos() {
        try {
            return JSON.parse(
                localStorage.getItem(CLAVE_TURNOS)
            ) || [];
        } catch (error) {
            return [];
        }
    }

    function guardarTurnos(turnos) {
        localStorage.setItem(
            CLAVE_TURNOS,
            JSON.stringify(turnos)
        );
    }

    // 4. OBTENER SELECCIONES

    function obtenerEspecialidad() {

        const seleccionada = document.querySelector(
            'input[name="especialidad"]:checked'
        );

        if (!seleccionada) return "";

        return seleccionada
            .closest(".especialidad-opcion")
            .querySelector("strong")
            .textContent.trim();
    }

    function obtenerProfesional() {

        const seleccionado = document.querySelector(
            'input[name="profesional"]:checked'
        );

        if (!seleccionado) return null;

        const id = Number(seleccionado.value);

        return catalogoProfesionales.find(
            profesional => profesional.id === id
        ) || null;
    }

    function convertirFecha(dia, mes) {

        const meses = {
            ene: "01",
            feb: "02",
            mar: "03",
            abr: "04",
            may: "05",
            jun: "06",
            jul: "07",
            ago: "08",
            sep: "09",
            oct: "10",
            nov: "11",
            dic: "12"
        };

        const numeroMes = meses[mes.trim().substring(0, 3).toLowerCase()];

        if (!numeroMes) return "";

        return `${dia.padStart(2, "0")}/${numeroMes}/2026`;
    }

    function obtenerFecha() {

        const seleccionada = document.querySelector(
            'input[name="fecha"]:checked'
        );

        if (!seleccionada) return "";

        const tarjeta = seleccionada.closest(".fecha-opcion");

        const dia = tarjeta.querySelector("strong")
            .textContent.trim();

        const mes = tarjeta.querySelector(".fecha-card span")
            .textContent.trim();

        return convertirFecha(dia, mes);
    }

    function obtenerHorario() {

        const seleccionado = document.querySelector(
            'input[name="horario"]:checked'
        );

        if (!seleccionado) return "";

        return seleccionado
            .closest(".horario-opcion")
            .querySelector("span")
            .textContent.trim();
    }

    // 5. MOSTRAR PROFESIONALES

    function renderizarProfesionales() {

        const especialidad = obtenerEspecialidad();

        const profesionalesFiltrados = catalogoProfesionales.filter(
            profesional =>
                profesional.especialidad === especialidad
        );

        contenedorProfesionales.innerHTML = "";

        if (profesionalesFiltrados.length === 0) {

            contenedorProfesionales.innerHTML = `
                <p class="mensaje-sin-profesionales">
                    No hay profesionales disponibles para esta especialidad.
                </p>
            `;

            return;
        }

        profesionalesFiltrados.forEach((profesional, index) => {

            const tarjeta = document.createElement("label");

            tarjeta.className = "profesional-opcion";

            tarjeta.innerHTML = `
                <input
                    type="radio"
                    name="profesional"
                    value="${profesional.id}"
                    ${index === 0 ? "checked" : ""}
                >

                <div class="profesional-card">

                    <img
                        src="${profesional.foto}"
                        alt="${profesional.nombre}"
                    >

                    <div class="datos-profesional">

                        <strong>${profesional.nombre}</strong>

                        <span>${profesional.especialidad}</span>

                        <small>Atención presencial</small>

                    </div>

                    <span class="seleccion-check">✓</span>

                </div>
            `;

            contenedorProfesionales.appendChild(tarjeta);

        });
    }
    // 6. VERIFICAR HORARIOS RESERVADOS

    function horarioReservado(profesional, fecha, horario) {

        return obtenerTurnos().some(turno => {

            const estado = (turno.estado || "").toLowerCase();

            const horarioGuardado = (turno.horario || "")
                .replace(" hs", "")
                .trim();

            return (
                turno.profesional === profesional &&
                turno.fecha === fecha &&
                horarioGuardado === horario &&
                estado !== "cancelado"
            );

        });
    }

    // 7. ACTUALIZAR HORARIOS

    function actualizarHorarios() {

        const profesional = obtenerProfesional();
        const fecha = obtenerFecha();

        let primerHorarioDisponible = null;

        horarios.forEach(input => {

            const tarjeta = input.closest(".horario-opcion");

            const horario = tarjeta.querySelector("span")
                .textContent.trim();

            const reservado = profesional && fecha
                ? horarioReservado(
                    profesional.nombre,
                    fecha,
                    horario
                )
                : false;

            tarjeta.style.display = reservado ? "none" : "";

            input.checked = false;

            if (!reservado && !primerHorarioDisponible) {
                primerHorarioDisponible = input;
            }

        });

        if (primerHorarioDisponible) {
            primerHorarioDisponible.checked = true;
        }

        actualizarResumen();
    }

    // 8. ACTUALIZAR FECHAS DISPONIBLES

    function actualizarDisponibilidad() {

        const profesional = obtenerProfesional();

        if (!profesional) {

            fechas.forEach(input => {
                input.checked = false;
                input.closest(".fecha-opcion").style.display = "none";
            });

            horarios.forEach(input => {
                input.checked = false;
                input.closest(".horario-opcion").style.display = "none";
            });

            actualizarResumen();

            return;
        }

        let primeraFechaDisponible = null;

        fechas.forEach(input => {

            const tarjeta = input.closest(".fecha-opcion");

            const dia = tarjeta.querySelector("strong")
                .textContent.trim();

            const mes = tarjeta.querySelector(".fecha-card span")
                .textContent.trim();

            const fecha = convertirFecha(dia, mes);

            const tieneHorarioDisponible = Array.from(horarios).some(
                horarioInput => {

                    const horario = horarioInput
                        .closest(".horario-opcion")
                        .querySelector("span")
                        .textContent.trim();

                    return !horarioReservado(
                        profesional.nombre,
                        fecha,
                        horario
                    );

                }
            );

            tarjeta.style.display =
                tieneHorarioDisponible ? "" : "none";

            input.checked = false;

            if (
                tieneHorarioDisponible &&
                !primeraFechaDisponible
            ) {
                primeraFechaDisponible = input;
            }

        });

        if (primeraFechaDisponible) {
            primeraFechaDisponible.checked = true;
        }

        actualizarHorarios();
    }

    // 9. ACTUALIZAR RESUMEN

    function actualizarResumen() {

        const especialidad = obtenerEspecialidad();
        const profesional = obtenerProfesional();
        const fecha = obtenerFecha();
        const horario = obtenerHorario();

        resumenEspecialidad.textContent =
            especialidad || "Sin seleccionar";

        resumenProfesional.textContent =
            profesional
                ? profesional.nombre
                : "Sin seleccionar";

        resumenFecha.textContent =
            fecha || "Sin seleccionar";

        resumenHorario.textContent =
            horario
                ? horario + " hs"
                : "Sin seleccionar";
    }

    // 10. CAMBIAR ESPECIALIDAD

    especialidades.forEach(input => {

        input.addEventListener("change", () => {

            renderizarProfesionales();

            actualizarDisponibilidad();

            actualizarResumen();

        });

    });

    // 11. CAMBIAR PROFESIONAL

    contenedorProfesionales.addEventListener("change", event => {

        if (event.target.name === "profesional") {

            actualizarDisponibilidad();

            actualizarResumen();

        }

    });
    // 12. CAMBIAR FECHA

    fechas.forEach(input => {

        input.addEventListener("change", () => {

            actualizarHorarios();

        });

    });

    // 13. CAMBIAR HORARIO

    horarios.forEach(input => {

        input.addEventListener("change", () => {

            actualizarResumen();

        });

    });

    // 14. CONFIRMAR TURNO

    botonConfirmar.addEventListener("click", () => {

        const especialidad = obtenerEspecialidad();
        const profesional = obtenerProfesional();
        const fecha = obtenerFecha();
        const horario = obtenerHorario();

        if (
            !especialidad ||
            !profesional ||
            !fecha ||
            !horario
        ) {

            alert("Por favor, completá todos los campos antes de confirmar.");

            return;
        }

        if (
            horarioReservado(
                profesional.nombre,
                fecha,
                horario
            )
        ) {

            alert("Este horario ya fue reservado. Elegí otro.");

            actualizarDisponibilidad();

            return;
        }

        const turnos = obtenerTurnos();

        const nuevoTurno = {

            id: Date.now(),

            especialidad: especialidad,

            profesional: profesional.nombre,

            foto: profesional.foto,

            fecha: fecha,

            horario: horario + " hs",

            consultorio: "Consultorio 204",

            estado: "Confirmado"

        };

        turnos.push(nuevoTurno);

        guardarTurnos(turnos);

        alert(
            "¡Tu turno fue reservado correctamente!\n\n" +
            "Especialidad: " + especialidad + "\n" +
            "Profesional: " + profesional.nombre + "\n" +
            "Fecha: " + fecha + "\n" +
            "Horario: " + horario
        );

        actualizarDisponibilidad();

        actualizarResumen();

    });


    renderizarProfesionales();

    actualizarDisponibilidad();

    actualizarResumen();

});
