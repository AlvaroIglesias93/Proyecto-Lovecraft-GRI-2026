export const DOSSIER_KEY = "eldritch_dossier";

export function guardarDossier(rol, datos) {
  const dossier = JSON.parse(localStorage.getItem(DOSSIER_KEY) || "{}");
  dossier[rol] = datos;
  localStorage.setItem(DOSSIER_KEY, JSON.stringify(dossier));
}

export function cargarDossier(rol) {
  const dossier = JSON.parse(localStorage.getItem(DOSSIER_KEY) || "{}");
  return dossier[rol] || null;
}

export function limpiarDossier() {
  localStorage.removeItem(DOSSIER_KEY);
}

export function aplicarDossierACrisis(rol, crisisDatos) {
  const datos = cargarDossier(rol);
  if (!datos) return crisisDatos;
  return {
    ...crisisDatos,
    hp: Math.max(5, crisisDatos.hp - datos.hp_restado),
    atk: Math.max(1, crisisDatos.atk - datos.atk_restado),
    maxHp: crisisDatos.maxHp,
  };
}

export const EVENTOS_PERSONAJES = {
  guardia: [
    {
      titulo: "Patrulla de Rutina",
      descripcion: "Edgar Vance asegura el perímetro del sanatorio.",
      efecto: { tipo: "escudo", valor: 5 },
    },
    {
      titulo: "Altercado en el Pabellón",
      descripcion: "Los internos se rebelan en el ala oeste. La tensión aumenta.",
      efecto: { tipo: "medidor", valor: -4 },
    },
    {
      titulo: "Ronda Nocturna",
      descripcion: "Vance reporta todo en calma. Te envía suministros.",
      efecto: { tipo: "robar", valor: 1 },
    },
    {
      titulo: "Fuga de Contención",
      descripcion: "¡Un paciente ha escapado! El pabellón se pone en alerta.",
      efecto: { tipo: "medidor", valor: -8 },
    },
  ],
  enfermero: [
    {
      titulo: "Dosis de Haloperidol",
      descripcion: "Miriam Crowe administra un sedante exitosamente.",
      efecto: { tipo: "medidor", valor: 6 },
    },
    {
      titulo: "Paciente Agitado",
      descripcion: "El interno forcejea durante la medicación. El estrés se propaga.",
      efecto: { tipo: "medidor", valor: -5 },
    },
    {
      titulo: "Vendaje Rápido",
      descripcion: "La enfermera cubre tus heridas menores con pericia.",
      efecto: { tipo: "escudo", valor: 8 },
    },
    {
      titulo: "Error de Medicación",
      descripcion: "Un fármaco mal etiquetado causa estragos en la sala.",
      efecto: { tipo: "medidor", valor: -6 },
    },
  ],
  doctor: [
    {
      titulo: "Terapia de Choque",
      descripcion: "Blackwood aplica electrodos con precisión milimétrica.",
      efecto: { tipo: "medidor", valor: 8 },
    },
    {
      titulo: "Diagnóstico Erróneo",
      descripcion: "El doctor malinterpreta los síntomas del paciente.",
      efecto: { tipo: "medidor", valor: -6 },
    },
    {
      titulo: "Hipnosis Regresiva",
      descripcion: "El paciente revela recuerdos ocultos que dañan su crisis.",
      efecto: { tipo: "daño_crisis", valor: 6 },
    },
    {
      titulo: "Sesión Interrumpida",
      descripcion: "Un grito en la distancia desconcentra al doctor.",
      efecto: { tipo: "medidor", valor: -4 },
    },
  ],
  alumno: [
    {
      titulo: "Notas Reveladoras",
      descripcion: "Cedric encuentra un patrón en sus apuntes y te lo pasa.",
      efecto: { tipo: "robar", valor: 1 },
    },
    {
      titulo: "Pregunta Incómoda",
      descripcion: "El alumno cuestiona tus métodos frente al paciente.",
      efecto: { tipo: "medidor", valor: -3 },
    },
    {
      titulo: "Epifanía Estudiantil",
      descripcion: "Una teoría novedosa aligera tu carga mental.",
      efecto: { tipo: "escudo", valor: 5 },
    },
    {
      titulo: "Crisis de Pánico",
      descripcion: "El alumno colapsa ante lo sobrenatural. Te contagia el miedo.",
      efecto: { tipo: "energia", valor: -1 },
    },
  ],
};

export function generarEventoAleatorio(personajeJugador) {
  const disponibles = Object.keys(EVENTOS_PERSONAJES).filter((p) => p !== personajeJugador);
  const quien = disponibles[Math.floor(Math.random() * disponibles.length)];
  const eventos = EVENTOS_PERSONAJES[quien];
  const evento = eventos[Math.floor(Math.random() * eventos.length)];
  return { personaje: quien, ...evento };
}

export function tomarUnTrago() {
  const valor = Math.floor(Math.random() * 5) + 5; // 5 a 9 puntos
  const buenEfecto = Math.random() < 0.5;
  return { buenEfecto, valor };
}

export function aplicarEfectoEvento(evento, cm) {
  const fx = evento.efecto;
  switch (fx.tipo) {
    case "medidor":
      if (cm.personajeId === "enfermero") {
        cm.medidorEstado = Math.min(cm.medidorMax, Math.max(0, cm.medidorEstado - fx.valor));
      } else {
        cm.medidorEstado = Math.min(cm.medidorMax, Math.max(0, cm.medidorEstado + fx.valor));
      }
      break;
    case "escudo":
      cm.escudoActual = Math.max(0, cm.escudoActual + fx.valor);
      break;
    case "robar":
      cm.robarCartasDirectas(fx.valor);
      break;
    case "energia":
      cm.energiaActual = Math.max(0, Math.min(cm.energiaMax, cm.energiaActual + fx.valor));
      break;
    case "daño_crisis":
      cm.crisisHp = Math.max(0, cm.crisisHp - fx.valor);
      break;
  }
  cm.actualizarCicloUI();
}

export class DataManager {
  // Manejo base de datos si se requiere persistencia local
}

export class PacienteFactory {
  constructor(bancoPacientes, patologias) {
    this.banco = bancoPacientes;
    this.patologias = patologias;
  }

  generarPacienteAleatorio() {
    const esMasculino = Math.random() > 0.5;
    const listaNombres = esMasculino ? this.banco.nombres_masculinos : this.banco.nombres_femeninos;
    const listaRetratos = esMasculino
      ? this.banco.retratos.masculinos
      : this.banco.retratos.femeninos;

    const nombre = listaNombres[Math.floor(Math.random() * listaNombres.length)];
    const apellido = this.banco.apellidos[Math.floor(Math.random() * this.banco.apellidos.length)];
    const retrato = listaRetratos[Math.floor(Math.random() * listaRetratos.length)];
    const crisisPlantilla = this.patologias[Math.floor(Math.random() * this.patologias.length)];

    return {
      nombreCompleto: `${nombre} ${apellido}`,
      retratoUrl: retrato,
      crisis: {
        id: crisisPlantilla.id,
        titulo: crisisPlantilla.nombre_crisis,
        hp: crisisPlantilla.vida_base,
        maxHp: crisisPlantilla.vida_base,
        atk: crisisPlantilla.ataque_base,
        descripcion: crisisPlantilla.descripcion,
        mazo: [...crisisPlantilla.mazo_enemigo],
      },
    };
  }
}

export class CombatManager {
  constructor(
    personajeId,
    poolCartas,
    renderManoCallback,
    renderStatsCallback,
    onTurnoTerminadoCallback,
    reversoCarta,
    onVictoriaCallback = null,
    onDerrotaCallback = null
  ) {
    this.personajeId = personajeId;
    this.poolOriginal = poolCartas;
    this.renderMano = renderManoCallback;
    this.renderStats = renderStatsCallback;
    this.onTurnoTerminado = onTurnoTerminadoCallback;
    this.reverso = reversoCarta;
    this.onVictoria = onVictoriaCallback;
    this.onDerrota = onDerrotaCallback;
    this.onRegistroEnemigo = null;

    // Estadísticas del Jugador
    this.energiaMax = 3;
    this.energiaActual = 3;
    this.escudoActual = 0;

    this.estadoDescarteForzado = false;
    this.debuffs = [];

    // El medidor se adapta según el rol (Histerismo, Estrés, Cordura...)
    this.medidorMax = { guardia: 50, doctor: 40, alumno: 30, enfermero: 35 }[personajeId] ?? 100;
    this.medidorEstado = personajeId === "enfermero" ? 0 : this.medidorMax;

    // Estado de la Amenaza / Crisis
    this.crisisHp = 100;
    this.crisisMaxHp = 100;
    this.crisisAtk = 0;
    this.mazoEnemigo = [];
    this.intencionEnemiga = null;

    // Cementerio y Mano
    this.mazoRobo = [];
    this.mano = [];
    this.descarte = [];
    this.contadorInstancia = 0;

    // Bitácora de efectos enemigos
    this.registroEnemigo = [];

    // Seguimiento para dossier
    this.totalDanioCausado = 0;
    this.totalAtkRestado = 0;
    this.atkInicial = 0;
  }

  inicializarCombate(crisisDatos) {
    this.crisisHp = crisisDatos.hp;
    this.crisisMaxHp = crisisDatos.maxHp || crisisDatos.hp;
    this.crisisAtk = crisisDatos.atk;
    this.crisisAtkBase = crisisDatos.atk;
    this.atkInicial = crisisDatos.atk;
    this.mazoEnemigo = crisisDatos.mazo;

    // Limpiar estado entre pacientes
    this.mano = [];
    this.descarte = [];
    this.debuffs = [];
    this.estadoDescarteForzado = false;
    this.estadoPendienteRobo = 0;

    // Limpiar registro y contadores
    this.registroEnemigo = [];
    if (this.onRegistroEnemigo) this.onRegistroEnemigo([]);
    this.totalDanioCausado = 0;
    this.totalAtkRestado = 0;

    // Preparar mazo de cartas propio
    this.mazoRobo = this.poolOriginal.map((c) => ({
      ...c,
      idInstancia: `c_${this.contadorInstancia++}`,
    }));
    this.barajar(this.mazoRobo);

    this.planificarAccionEnemiga();
    this.reponerTurno(4);
  }

  aplicarDebuff(cantidad, duracion) {
    this.debuffs.push({ cantidad, turnosRestantes: duracion });
    const atkAntes = this.crisisAtk;
    this.recalcularAtk();
    this.totalAtkRestado += atkAntes - this.crisisAtk;
  }

  decayDebuffs() {
    this.debuffs = this.debuffs
      .map((d) => ({ ...d, turnosRestantes: d.turnosRestantes - 1 }))
      .filter((d) => d.turnosRestantes > 0);
    this.recalcularAtk();
  }

  recalcularAtk() {
    const reduccionTotal = this.debuffs.reduce((sum, d) => sum + d.cantidad, 0);
    this.crisisAtk = Math.max(0, this.crisisAtkBase - reduccionTotal);
  }

  reponerTurno(cantidadRobo = 1) {
    this.energiaActual = this.energiaMax;
    this.escudoActual = 0;

    if (this.mano.length >= 6 && cantidadRobo > 0) {
      this.estadoDescarteForzado = true;
      this.estadoPendienteRobo = cantidadRobo;
      this.actualizarCicloUI();
      return;
    }

    for (let i = 0; i < cantidadRobo; i++) {
      if (this.mazoRobo.length === 0) {
        this.mazoRobo = [...this.descarte];
        this.descarte = [];
        this.barajar(this.mazoRobo);
      }
      if (this.mazoRobo.length > 0) {
        this.mano.push(this.mazoRobo.shift());
      }
    }

    this.actualizarCicloUI();
  }

  jugarCarta(idInstancia) {
    const indice = this.mano.findIndex((c) => c.idInstancia === idInstancia);
    if (indice === -1) return;

    const carta = this.mano[indice];

    if (this.estadoDescarteForzado) {
      this.mano.splice(indice, 1);
      this.descarte.push(carta);
      this.estadoDescarteForzado = false;

      const pendiente = this.estadoPendienteRobo;
      this.estadoPendienteRobo = 0;

      for (let i = 0; i < pendiente; i++) {
        if (this.mazoRobo.length === 0) {
          this.mazoRobo = [...this.descarte];
          this.descarte = [];
          this.barajar(this.mazoRobo);
        }
        if (this.mazoRobo.length > 0) {
          this.mano.push(this.mazoRobo.shift());
        }
      }

      this.actualizarCicloUI();
      return;
    }

    // --- VALIDACIÓN DE ACCIONES / ENERGÍA ---
    if (this.energiaActual < carta.coste) {
      console.warn("No te queda suficiente energía para esta acción.");
      return;
    }

    // Restar el coste de energía inmediatamente
    this.energiaActual -= carta.coste;

    // Eliminar de la mano y mandar al descarte
    this.mano.splice(indice, 1);
    this.descarte.push(carta);

    // --- PROCESADOR UNIVERSAL DE EFECTOS ---
    const fx = carta.efecto;
    if (fx) {
      if (fx.tipo === "bloqueo") {
        this.escudoActual += fx.valor;
      }
      if (fx.tipo === "daño_crisis") {
        const d = fx.valor || fx.daño || 0;
        this.crisisHp = Math.max(0, this.crisisHp - d);
        this.totalDanioCausado += d;
      }
      if (fx.tipo === "reducir_medidor") {
        this.medidorEstado = Math.max(0, this.medidorEstado - fx.valor);
      }
      if (fx.tipo === "sanar_medidor") {
        if (this.personajeId === "enfermero") {
          this.medidorEstado = Math.max(0, this.medidorEstado - fx.valor);
        } else {
          this.medidorEstado = Math.min(this.medidorMax, this.medidorEstado + fx.valor);
        }
      }
      if (fx.tipo === "reducir_ataque") {
        this.aplicarDebuff(fx.valor, fx.duracion || 1);
      }
      if (fx.tipo === "robar_cartas") {
        this.robarCartasDirectas(fx.valor);
      }
      // Combinados y contraefectos
      if (fx.tipo === "daño_y_debuff") {
        const d = fx.daño || 0;
        this.crisisHp = Math.max(0, this.crisisHp - d);
        this.totalDanioCausado += d;
        this.aplicarDebuff(fx.debuff, fx.duracion || 1);
      }
      if (fx.tipo === "daño_y_cura") {
        const d = fx.daño || 0;
        this.crisisHp = Math.max(0, this.crisisHp - d);
        this.totalDanioCausado += d;
        if (this.personajeId === "enfermero") {
          this.medidorEstado = Math.max(0, this.medidorEstado - fx.cura);
        } else {
          this.medidorEstado = Math.min(this.medidorMax, this.medidorEstado + fx.cura);
        }
      }
      if (fx.tipo === "daño_y_block") {
        const d = fx.daño || 0;
        this.crisisHp = Math.max(0, this.crisisHp - d);
        this.totalDanioCausado += d;
        this.escudoActual += fx.block;
      }
      if (fx.tipo === "robo_con_daño") {
        this.robarCartasDirectas(fx.robo);
        this.medidorEstado = Math.max(0, this.medidorEstado - fx.daño);
      }
      if (fx.tipo === "sanar_medidor_con_contraefecto") {
        this.medidorEstado = Math.min(this.medidorMax, this.medidorEstado + fx.valor);
        if (fx.daño_propio) {
          if (this.personajeId === "enfermero") {
            this.medidorEstado = Math.min(this.medidorMax, this.medidorEstado + fx.daño_propio);
          } else {
            this.medidorEstado = Math.max(0, this.medidorEstado - fx.daño_propio);
          }
        }
      }
      if (fx.tipo === "daño_y_robo") {
        const d = fx.daño || 0;
        this.crisisHp = Math.max(0, this.crisisHp - d);
        this.totalDanioCausado += d;
        this.robarCartasDirectas(fx.robo);
      }
      if (fx.tipo === "robo_y_block") {
        this.robarCartasDirectas(fx.robo);
        this.escudoActual += fx.block;
      }
      if (fx.tipo === "debuff_y_block") {
        this.aplicarDebuff(fx.debuff, fx.duracion || 1);
        this.escudoActual += fx.block;
      }
      if (fx.tipo === "cura_y_robo") {
        if (this.personajeId === "enfermero") {
          this.medidorEstado = Math.max(0, this.medidorEstado - fx.cura);
        } else {
          this.medidorEstado = Math.min(this.medidorMax, this.medidorEstado + fx.cura);
        }
        this.robarCartasDirectas(fx.robo);
      }
      if (fx.tipo === "cura_y_block") {
        if (this.personajeId === "enfermero") {
          this.medidorEstado = Math.max(0, this.medidorEstado - fx.cura);
        } else {
          this.medidorEstado = Math.min(this.medidorMax, this.medidorEstado + fx.cura);
        }
        this.escudoActual += fx.block;
      }
    }

    this.actualizarCicloUI();
    this.verificarCondicionesFin();
  }

  robarCartasDirectas(cantidad) {
    for (let i = 0; i < cantidad; i++) {
      if (this.mazoRobo.length === 0) {
        this.mazoRobo = [...this.descarte];
        this.descarte = [];
        this.barajar(this.mazoRobo);
      }
      if (this.mazoRobo.length > 0) {
        this.mano.push(this.mazoRobo.shift());
      }
    }
  }

  planificarAccionEnemiga() {
    if (this.mazoEnemigo.length > 0) {
      const azar = Math.floor(Math.random() * this.mazoEnemigo.length);
      this.intencionEnemiga = this.mazoEnemigo[azar];
    } else {
      this.intencionEnemiga = { nombre: "Ataque Básico", daño: 6 };
    }
  }

  procesarTurnoEnemigo() {
    if (!this.intencionEnemiga) {
      this.planificarAccionEnemiga();
      this.reponerTurno();
      return;
    }

    this.decayDebuffs();

    const cartaUsada = this.intencionEnemiga;

    // Los debuffs reducen el daño físico de las cartas enemigas
    const reduccionPorDebuff = Math.max(0, this.crisisAtkBase - this.crisisAtk);
    let dañoFisico = Math.max(0, (cartaUsada.daño || 0) - reduccionPorDebuff);
    const dañoInevitable = cartaUsada.escudo || 0;
    let escudoAbsorbido = 0;

    // El daño físico puede ser absorbido por el escudo del jugador
    if (dañoFisico > 0 && this.escudoActual > 0) {
      if (this.escudoActual >= dañoFisico) {
        escudoAbsorbido = dañoFisico;
        this.escudoActual -= dañoFisico;
        dañoFisico = 0;
      } else {
        escudoAbsorbido = this.escudoActual;
        dañoFisico -= this.escudoActual;
        this.escudoActual = 0;
      }
    }

    // El daño inevitable (escudo enemigo) y el daño físico restante afectan al medidor
    const dañoTotal = dañoFisico + dañoInevitable;
    if (dañoTotal > 0) {
      if (this.personajeId === "enfermero") {
        this.medidorEstado = Math.min(this.medidorMax, this.medidorEstado + dañoTotal);
      } else {
        this.medidorEstado = Math.max(0, this.medidorEstado - dañoTotal);
      }
    }

    // Registrar en bitácora
    this.registroEnemigo.unshift({
      nombre: cartaUsada.nombre || "Ataque Básico",
      dañoBruto: cartaUsada.daño || 0,
      dañoNeto: dañoFisico,
      escudoEnemigo: dañoInevitable,
      escudoAbsorbido,
      dañoTotal,
      turno: this.registroEnemigo.length + 1,
    });
    if (this.registroEnemigo.length > 5) this.registroEnemigo.length = 5;
    if (this.onRegistroEnemigo) this.onRegistroEnemigo(this.registroEnemigo);

    // Preparar siguiente ciclo
    this.planificarAccionEnemiga();
    this.reponerTurno();
    this.verificarCondicionesFin();
  }

  actualizarCicloUI() {
    this.renderMano(this.mano, this.estadoDescarteForzado);
    this.renderStats({
      energia: this.energiaActual,
      escudo: this.escudoActual,
      crisisHp: this.crisisHp,
      crisisMaxHp: this.crisisMaxHp,
      crisisAtk: this.crisisAtk,
      medidor: this.medidorEstado,
      medidorMax: this.medidorMax,
      intencionEnemiga: this.intencionEnemiga,
    });
  }

  verificarCondicionesFin() {
    // Victoria por rol
    if (this.personajeId === "guardia" && this.crisisAtk <= 0) {
      if (this.onVictoria) this.onVictoria();
      return;
    }
    if (this.personajeId === "enfermero" && this.crisisHp <= Math.ceil(this.crisisMaxHp * 0.5)) {
      if (this.onVictoria) this.onVictoria();
      return;
    }
    // Victoria genérica (crisis eliminada)
    if (this.crisisHp <= 0) {
      if (this.onVictoria) this.onVictoria();
      return;
    }

    // Derrota
    if (this.personajeId === "enfermero" && this.medidorEstado >= this.medidorMax) {
      if (this.onDerrota) this.onDerrota("Estrés Clínico");
      return;
    } else if (this.personajeId !== "enfermero" && this.medidorEstado <= 0) {
      const razon =
        this.personajeId === "alumno"
          ? "Cordura Propia"
          : this.personajeId === "doctor"
            ? "Resistencia del Doctor"
            : "Aguante Físico";
      if (this.onDerrota) this.onDerrota(razon);
      return;
    }
  }

  generarDossier() {
    return {
      hp_restado: this.totalDanioCausado,
      atk_restado: this.totalAtkRestado,
      hp_restante: this.crisisHp,
    };
  }

  barajar(lista) {
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
  }
}
