import {
  DataManager,
  PacienteFactory,
  CombatManager,
  generarEventoAleatorio,
  tomarUnTrago,
  aplicarEfectoEvento,
  guardarDossier,
  cargarDossier,
  limpiarDossier,
  aplicarDossierACrisis,
} from "./engine.js";
import { MenuUI } from "./ui.js";

let combatManager = null;
let menuUI = null;
let juegoDatosGlobal = null;
let personajeGlobal = null;
let pacientesCurados = 0;
const MAX_PACIENTES = 5;

document.addEventListener("DOMContentLoaded", () => {
  // El botón de entrada debe funcionar inmediatamente, sin esperar la carga de datos
  document.getElementById("menu-enter-btn").addEventListener("click", () => {
    document.getElementById("main-menu").classList.remove("active");
    document.getElementById("char-selection").classList.add("active");
  });

  (async () => {
    try {
      const [resCarts, resPersonajes, resEnemigos, resPreguntas] = await Promise.all([
        fetch("./assets/js/carts.json").then((r) => r.json()),
        fetch("./assets/js/personajes.json").then((r) => r.json()),
        fetch("./assets/js/enemigos.json").then((r) => r.json()),
        fetch("./assets/js/preguntas_alumno.json").then((r) => r.json()),
      ]);

      juegoDatosGlobal = {
        ...resEnemigos,
        ...resPersonajes,
        ...resCarts,
        ...resPreguntas,
      };
    } catch (error) {
      console.error(
        "Error crítico de carga: Asegúrate de servir el proyecto desde un servidor web (Live Server) para evitar bloqueos de CORS.",
        error
      );
      return;
    }

    if (juegoDatosGlobal) {
      menuUI = new MenuUI("char-grid", (personajeSeleccionado) => {
        personajeGlobal = personajeSeleccionado;
        pacientesCurados = 0;
        // Limpiar solo el dossier del rol actual al empezar (para no arrastrar datos viejos del mismo rol)
        // Los dossiers de OTROS roles persisten para beneficiar al Doctor
        const dossierExistente = JSON.parse(localStorage.getItem("eldritch_dossier") || "{}");
        delete dossierExistente[personajeSeleccionado.id];
        localStorage.setItem("eldritch_dossier", JSON.stringify(dossierExistente));
        ejecutarTransicionATablero(personajeSeleccionado, juegoDatosGlobal);
      });
      menuUI.dibujarMenuSeleccion(juegoDatosGlobal.personajes_jugables);
    }
  })();
});

function volverAlMenu() {
  document.getElementById("game-board").classList.remove("active");
  document.getElementById("char-selection").classList.add("active");
  document.getElementById("narrative-modal").classList.remove("active");
  document.getElementById("narrative-modal").style.display = "none";
  pacientesCurados = 0;
}

function ejecutarTransicionATablero(personaje, juegoDatos) {
  document.getElementById("char-selection").classList.remove("active");
  document.getElementById("game-board").classList.add("active");

  if (personaje.fondo) {
    const board = document.getElementById("game-board");
    board.style.backgroundImage = `url('${personaje.fondo}')`;
    board.style.backgroundSize = "cover";
    board.style.backgroundPosition = "center";
    board.style.backgroundRepeat = "no-repeat";
  }

  document.getElementById("player-img").src = personaje.datosElegidos.retrato || "";
  document.getElementById("player-name").textContent = personaje.datosElegidos.nombre;
  document.getElementById("player-role").textContent = personaje.rol;
  document.getElementById("meter-label").textContent = personaje.medidor;

  const pacienteFactory = new PacienteFactory(
    juegoDatos.banco_pacientes,
    juegoDatos.patologias_enemigas
  );
  let pacienteActual = pacienteFactory.generarPacienteAleatorio();

  // Aplicar dossier de roles previos (si el rol actual es doctor, los beneficios de guardia/enfermero se aplican)
  if (personaje.id === "doctor") {
    const dossierGuardia = cargarDossier("guardia");
    const dossierEnfermero = cargarDossier("enfermero");
    if (dossierGuardia) {
      pacienteActual.crisis = aplicarDossierACrisis("guardia", pacienteActual.crisis);
    }
    if (dossierEnfermero) {
      pacienteActual.crisis = aplicarDossierACrisis("enfermero", pacienteActual.crisis);
    }
  }

  document.getElementById("enemy-name").textContent = pacienteActual.nombreCompleto;
  document.getElementById("enemy-img").src = pacienteActual.retratoUrl || "";
  document.getElementById("enemy-crisis-tag").textContent = pacienteActual.crisis.titulo;
  document.getElementById("enemy-desc").textContent = pacienteActual.crisis.descripcion;

  document.getElementById("global-events").textContent = personaje.datosElegidos.intro;

  let pacienteActualObj = pacienteActual;
  const poolDeClase = juegoDatos.pool_cartas[personaje.id] || [];

  // --- MANEJADOR DE HISTORIAS NARRATIVAS (30+ NODOS) ---
  let indiceNarrativo = 0;
  const activarNarrativaAlumno = () => {
    if (!juegoDatos.sistema_narrativo || !juegoDatos.sistema_narrativo.nodos) return;

    const nodes = juegoDatos.sistema_narrativo.nodos;
    if (indiceNarrativo < nodes.length) {
      menuUI.dibujarModalNarrativo(nodes[indiceNarrativo], (opcionElegida) => {
        const fx = opcionElegida.efecto;
        if (fx) {
          if (fx.tipo === "modificar_medidor") {
            combatManager.medidorEstado = Math.min(
              combatManager.medidorMax || 100,
              Math.max(0, combatManager.medidorEstado + fx.valor)
            );
          }
          if (fx.energia_bonus && fx.energia_bonus !== 0) {
            combatManager.energiaActual = Math.max(
              0,
              combatManager.energiaActual + fx.energia_bonus
            );
          }
          if (fx.efecto_combate) {
            aplicarEfectoCombateNarrativa(fx.efecto_combate);
          }
        }

        combatManager.actualizarCicloUI();
        combatManager.verificarCondicionesFin();
        indiceNarrativo++;
      });
    }
  };

  const aplicarEfectoCombateNarrativa = (efectoCombate) => {
    if (!combatManager || !efectoCombate) return;
    const fx = efectoCombate;

    if (fx.tipo === "bloqueo") {
      combatManager.escudoActual = Math.max(0, combatManager.escudoActual + fx.valor);
    }

    if (fx.tipo === "reducir_ataque") {
      combatManager.aplicarDebuff(fx.valor, fx.duracion || 1);
    }

    if (fx.tipo === "aumentar_ataque") {
      combatManager.crisisAtkBase = Math.max(0, combatManager.crisisAtkBase + fx.valor);
      combatManager.recalcularAtk();
    }

    if (fx.tipo === "robar_cartas") {
      combatManager.robarCartasDirectas(fx.valor);
    }

    if (fx.tipo === "daño_crisis") {
      combatManager.crisisHp = Math.min(
        combatManager.crisisMaxHp,
        Math.max(0, combatManager.crisisHp - fx.valor)
      );
    }

    combatManager.actualizarCicloUI();
  };

  const renderStatsFn = (stats) => {
    document.getElementById("current-energy").textContent = stats.energia;
    document.getElementById("player-shield").textContent = stats.escudo;
    document.getElementById("enemy-hp").textContent = `${stats.crisisHp} / ${stats.crisisMaxHp}`;
    document.getElementById("enemy-atk").textContent = stats.crisisAtk;
    const maxMed = stats.medidorMax || 100;
    document.getElementById("meter-value").textContent = `${stats.medidor} / ${maxMed}`;
    document.getElementById("main-meter").style.width = `${(stats.medidor / maxMed) * 100}%`;
  };

  const onRegistroEnemigo = (registro) => {
    menuUI.dibujarRegistroEnemigo(registro);
  };

  const onVictoria = () => {
    // Guardar dossier de este rol para beneficiar al siguiente
    const dossier = combatManager.generarDossier();
    guardarDossier(personaje.id, dossier);

    pacientesCurados++;
    if (pacientesCurados >= MAX_PACIENTES) {
      menuUI.dibujarPantallaVictoria(MAX_PACIENTES, () => volverAlMenu());
    } else {
      mostrarDecisionPostCura(personaje, juegoDatos, pacienteFactory);
    }
  };

  const onDerrota = (razon) => {
    limpiarDossier();
    menuUI.dibujarPantallaDerrota(razon, personaje.datosElegidos.nombre, () => volverAlMenu());
  };

  combatManager = new CombatManager(
    personaje.id,
    poolDeClase,
    (manoActual, descarteForzado) => {
      menuUI.dibujarManoCartas(
        manoActual,
        (idInstancia) => combatManager.jugarCarta(idInstancia),
        descarteForzado
      );
    },
    renderStatsFn,
    activarNarrativaAlumno,
    juegoDatos.configuracion_global.reverso_carta_enemiga,
    onVictoria,
    onDerrota
  );
  combatManager.onRegistroEnemigo = onRegistroEnemigo;

  const botonFinTurno = document.getElementById("end-turn-btn");
  const nuevoBoton = botonFinTurno.cloneNode(true);
  botonFinTurno.parentNode.replaceChild(nuevoBoton, botonFinTurno);
  nuevoBoton.addEventListener("click", () => {
    combatManager.procesarTurnoEnemigo();
    if (personaje.id === "alumno") {
      activarNarrativaAlumno();
    }
    if (Math.random() < 0.3) {
      const evento = generarEventoAleatorio(personaje.id);
      aplicarEfectoEvento(evento, combatManager);
      menuUI.mostrarEventoAleatorio(evento);
      combatManager.verificarCondicionesFin();
    }
  });

  combatManager.inicializarCombate(pacienteActual.crisis);

  if (personaje.id === "alumno") {
    setTimeout(() => {
      activarNarrativaAlumno();
    }, 700);
  }
}

function mostrarDecisionPostCura(personaje, juegoDatos, pacienteFactory) {
  menuUI.dibujarModalDecisionPostCura(
    () => {
      iniciarSiguientePaciente(personaje, juegoDatos, pacienteFactory);
    },
    () => {
      const efecto = tomarUnTrago();
      if (combatManager) {
        if (combatManager.personajeId === "enfermero") {
          combatManager.medidorEstado = Math.min(
            combatManager.medidorMax,
            Math.max(
              0,
              combatManager.medidorEstado + (efecto.buenEfecto ? -efecto.valor : efecto.valor)
            )
          );
        } else {
          combatManager.medidorEstado = Math.min(
            combatManager.medidorMax,
            Math.max(
              0,
              combatManager.medidorEstado + (efecto.buenEfecto ? efecto.valor : -efecto.valor)
            )
          );
        }
        combatManager.actualizarCicloUI();
      }
      menuUI.mostrarEfectoTrago(efecto, () => {
        iniciarSiguientePaciente(personaje, juegoDatos, pacienteFactory);
      });
    },
    () => {
      volverAlMenu();
    }
  );
}

function iniciarSiguientePaciente(personaje, juegoDatos, pacienteFactory) {
  let nuevoPaciente = pacienteFactory.generarPacienteAleatorio();

  // Aplicar dossier de roles previos también en pacientes siguientes
  if (personaje.id === "doctor") {
    const dossierGuardia = cargarDossier("guardia");
    const dossierEnfermero = cargarDossier("enfermero");
    if (dossierGuardia) {
      nuevoPaciente.crisis = aplicarDossierACrisis("guardia", nuevoPaciente.crisis);
    }
    if (dossierEnfermero) {
      nuevoPaciente.crisis = aplicarDossierACrisis("enfermero", nuevoPaciente.crisis);
    }
  }

  document.getElementById("enemy-name").textContent = nuevoPaciente.nombreCompleto;
  document.getElementById("enemy-img").src = nuevoPaciente.retratoUrl || "";
  document.getElementById("enemy-crisis-tag").textContent = nuevoPaciente.crisis.titulo;
  document.getElementById("enemy-desc").textContent = nuevoPaciente.crisis.descripcion;

  const contador = document.getElementById("game-board").querySelector(".patient-counter");
  if (contador) {
    contador.textContent = `Paciente ${pacientesCurados + 1} / ${MAX_PACIENTES}`;
  }

  combatManager.inicializarCombate(nuevoPaciente.crisis);
}
