document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // EDITAR PERFIL
    // ==========================================

    const botonEditar = document.getElementById("editar-perfil");

    const campos = {
        nombre: document.getElementById("nombre-perfil"),
        dni: document.getElementById("dni-perfil"),
        correo: document.getElementById("correo-perfil"),
        telefono: document.getElementById("telefono-perfil"),
        nacimiento: document.getElementById("nacimiento-perfil"),
        domicilio: document.getElementById("domicilio-perfil")
    };

    const nombrePresentacion = document.getElementById("nombre-presentacion");

    if (botonEditar && Object.values(campos).every(campo => campo)) {

        const datosGuardados = localStorage.getItem("datosPerfil");

        if (datosGuardados) {
            try {
                const datos = JSON.parse(datosGuardados);

                Object.keys(campos).forEach(clave => {
                    if (datos[clave] !== undefined) {
                        campos[clave].textContent = datos[clave];
                    }
                });

                if (nombrePresentacion && datos.nombre) {
                    nombrePresentacion.textContent = datos.nombre;
                }

            } catch (error) {
                console.error("Error al recuperar los datos:", error);
            }
        }

        let editando = false;

        botonEditar.addEventListener("click", () => {

            if (!editando) {

                Object.keys(campos).forEach(clave => {

                    const valor = campos[clave].textContent;

                    const input = document.createElement("input");
                    input.type = "text";
                    input.value = valor;
                    input.classList.add("input-editar-perfil");

                    campos[clave].textContent = "";
                    campos[clave].appendChild(input);

                });

                botonEditar.textContent = "Guardar cambios";
                editando = true;

            } else {

                const nuevosDatos = {};
                let camposValidos = true;

                Object.keys(campos).forEach(clave => {

                    const input = campos[clave].querySelector("input");
                    const valor = input.value.trim();

                    if (valor === "") {
                        camposValidos = false;
                    }

                    nuevosDatos[clave] = valor;

                });

                if (!camposValidos) {
                    alert("Completá todos los campos antes de guardar.");
                    return;
                }

                Object.keys(campos).forEach(clave => {
                    campos[clave].textContent = nuevosDatos[clave];
                });

                localStorage.setItem(
                    "datosPerfil",
                    JSON.stringify(nuevosDatos)
                );

                if (nombrePresentacion) {
                    nombrePresentacion.textContent = nuevosDatos.nombre;
                }

                botonEditar.textContent = "✎ Editar perfil";
                editando = false;

                alert("¡Tus datos se actualizaron correctamente!");

            }

        });

    }


    // ==========================================
    // MENÚ LATERAL
    // ==========================================

    const enlacesMenu = document.querySelectorAll(".menu-lateral-perfil a");

    enlacesMenu.forEach(enlace => {

        const href = enlace.getAttribute("href");

        if (href) {

            const paginaActual = window.location.pathname.split("/").pop();
            const paginaEnlace = href.split("/").pop();

            if (paginaActual === paginaEnlace) {
                enlace.classList.add("activo");
            }

        }

    });


    // ==========================================
    // DATOS COMPARTIDOS (mismas claves que usuario.js y admin.js)
    // ==========================================

    const CLAVE_RESERVADOS = "admin_turnosReservados_v2";
    const CLAVE_FAVORITOS = "favoritosProfesionales_v2";
    const PACIENTE_ACTUAL_ID = "paciente-actual";

    function leerLista(clave) {
        try {
            const lista = JSON.parse(localStorage.getItem(clave));
            return Array.isArray(lista) ? lista : [];
        } catch (error) {
            console.error("Error al leer " + clave, error);
            return [];
        }
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


    // ==========================================
    // MOSTRAR MÉDICOS FAVORITOS
    // ==========================================

    function mostrarFavoritosPerfil() {

        const contenedor = document.getElementById("lista-favoritos-perfil");

        if (!contenedor) return;

        const medicosFavoritos = leerLista(CLAVE_FAVORITOS);

        if (medicosFavoritos.length === 0) {
            contenedor.innerHTML = "<p>No tenés médicos favoritos todavía.</p>";
            return;
        }

        contenedor.innerHTML = medicosFavoritos.map(medico => {

            const iniciales = medico.nombre
                .replace("Dra. ", "")
                .replace("Dr. ", "")
                .split(" ")
                .map(palabra => palabra[0])
                .slice(0, 2)
                .join("");

            return `
                <article class="medico-favorito-perfil">

                    <div class="avatar-medico-perfil">
                        ${escapar(iniciales)}
                    </div>

                    <div class="datos-medico-perfil">
                        <h4>${escapar(medico.nombre)}</h4>
                        <p>${escapar(medico.especialidad)}</p>
                    </div>

                    <span class="corazon-favorito">♥</span>

                    <a href="usuario.html" class="button-solicitar-perfil">
                        Solicitar turno
                    </a>

                </article>
            `;

        }).join("");

    }


    // ==========================================
    // OBTENER PRÓXIMOS TURNOS (reservados por este paciente en usuario.html)
    // Si el admin cancela un turno, deja de estar en "reservados" y desaparece acá.
    // ==========================================

    function obtenerProximosTurnos() {

        const hoy = hoyISO();

        return leerLista(CLAVE_RESERVADOS)
            .filter(turno => turno.reservadoPor === PACIENTE_ACTUAL_ID && turno.fecha >= hoy)
            .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

    }


    // ==========================================
    // MOSTRAR PRÓXIMA CONSULTA
    // ==========================================

    function mostrarProximaConsulta() {

        const contenedor = document.getElementById("proxima-consulta-perfil");

        if (!contenedor) return;

        const proximos = obtenerProximosTurnos();

        if (proximos.length === 0) {
            contenedor.innerHTML = `<p>No tenés próximos turnos reservados.</p>`;
            return;
        }

        const turno = proximos[0];
        const fecha = new Date(turno.fecha + "T00:00:00");
        const dia = fecha.getDate();

        const mes = fecha.toLocaleDateString("es-AR", {
            month: "short"
        }).replace(".", "").toUpperCase();

        const ubicacion = turno.comentario
            ? `${turno.sede} · ${turno.comentario}`
            : turno.sede;

        contenedor.innerHTML = `
            <article class="consulta-perfil">

                <div class="fecha-consulta">
                    <strong>${dia}</strong>
                    <span>${mes}</span>
                </div>

                <div class="datos-consulta">

                    <h4>${escapar(turno.especialidad)}</h4>

                    <p>${escapar(turno.profesional)}</p>

                    <span>${escapar(turno.hora)} hs · ${escapar(ubicacion)}</span>

                </div>

                <span class="estado-consulta">Reservado</span>

            </article>
        `;

    }


    // ==========================================
    // ACTUALIZAR ESTADÍSTICAS
    // ==========================================

    function actualizarEstadisticas() {

        const contadorProximos = document.getElementById("contador-proximos");
        const contadorFavoritos = document.getElementById("contador-favoritos");

        // CONTADOR DE FAVORITOS

        const favoritos = leerLista(CLAVE_FAVORITOS);

        if (contadorFavoritos) {
            contadorFavoritos.textContent = favoritos.length;
        }

        // CONTADOR DE PRÓXIMOS TURNOS

        const proximos = obtenerProximosTurnos();

        if (contadorProximos) {
            contadorProximos.textContent = proximos.length;
        }

    }


    // ==========================================
    // EJECUTAR FUNCIONES
    // ==========================================

    function actualizarPerfilCompleto() {

        actualizarEstadisticas();
        mostrarFavoritosPerfil();
        mostrarProximaConsulta();

    }

    actualizarPerfilCompleto();

    // Actualizar si cambian los datos desde otra pestaña
    window.addEventListener("storage", actualizarPerfilCompleto);

});