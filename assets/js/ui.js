export class MenuUI {
  constructor(gridId, onSelectCallback) {
    this.gridElement = document.getElementById(gridId);
    this.onSelectCallback = onSelectCallback;
  }

  dibujarMenuSeleccion(personajes) {
    if (!this.gridElement) return;
    this.gridElement.innerHTML = "";

    personajes.forEach((p) => {
      const card = document.createElement("div");
      card.className = "char-card";

      const generoInicial = "m";
      const datosIniciales = p.variantes[generoInicial];

      card.innerHTML = `
        <div class="char-img-wrapper">
          <img src="${datosIniciales.retrato}" alt="${p.rol}" class="char-portrait" data-genero="${generoInicial}">
        </div>
        <h3>${p.rol}</h3>
        <p class="char-role-title">${p.medidor}</p>
        <div class="gender-selector">
          <button class="gender-btn selected" data-genero="m">Masculino</button>
          <button class="gender-btn" data-genero="f">Femenino</button>
        </div>
        <button class="select-btn">Seleccionar</button>
      `;

      const img = card.querySelector(".char-portrait");
      const btns = card.querySelectorAll(".gender-btn");

      btns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          btns.forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          const genero = btn.dataset.genero;
          img.src = p.variantes[genero].retrato;
          img.dataset.genero = genero;
        });
      });

      card.querySelector(".select-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const genero = img.dataset.genero;
        this.onSelectCallback({
          id: p.id,
          rol: p.rol,
          medidor: p.medidor,
          fondo: p.escenario_fondo,
          datosElegidos: p.variantes[genero],
        });
      });

      this.gridElement.appendChild(card);
    });
  }

  dibujarManoCartas(cartas, onPlayCallback, descarteForzado = false) {
    const contenedor = document.getElementById("player-hand");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (descarteForzado) {
      const aviso = document.createElement("div");
      aviso.className = "discard-warning";
      aviso.textContent = "Debes descartar una carta (mano llena)";
      contenedor.appendChild(aviso);
    }

    cartas.forEach((c) => {
      const cardEl = document.createElement("div");
      cardEl.className = "game-card";
      if (descarteForzado) cardEl.classList.add("forced-discard");
      cardEl.innerHTML = `
        <div class="game-card-header">
          <span class="game-card-title">${c.nombre}</span>
          <span class="game-card-cost">${c.coste}</span>
        </div>
        <div class="game-card-art" style="background-image: url('${c.imagen || ""}')"></div>
        <div class="game-card-body">${c.descripcion}</div>
      `;
      cardEl.addEventListener("click", () => onPlayCallback(c.idInstancia));
      contenedor.appendChild(cardEl);
    });
  }

  dibujarPantallaVictoria(totalPacientes, onMenuCallback) {
    const overlay = document.createElement("div");
    overlay.className = "endgame-overlay victory";
    overlay.id = "endgame-screen";
    overlay.innerHTML = `
      <div class="endgame-box">
        <h2 class="endgame-title">Éxito Clínico Total</h2>
        <div class="endgame-icon">&#x1f3c6;</div>
        <p class="endgame-body">
          Has logrado estabilizar y curar a <strong>${totalPacientes} pacientes</strong> en el Sanatorio Eldritch.<br>
          La junta médica de la Universidad de Miskatonic reconoce tu valiosa contribución.
        </p>
        <p class="endgame-sub">El horror cósmico retrocede... por ahora.</p>
        <button class="endgame-btn">Volver al Menú Principal</button>
      </div>
    `;
    overlay.querySelector(".endgame-btn").addEventListener("click", () => {
      overlay.remove();
      onMenuCallback();
    });
    document.body.appendChild(overlay);
  }

  dibujarPantallaDerrota(razon, nombrePersonaje, onMenuCallback) {
    const overlay = document.createElement("div");
    overlay.className = "endgame-overlay defeat";
    overlay.id = "endgame-screen";
    overlay.innerHTML = `
      <div class="endgame-box">
        <h2 class="endgame-title">Colapso Clínico</h2>
        <div class="endgame-icon">&#x1f480;</div>
        <p class="endgame-body">
          <strong>${nombrePersonaje}</strong> ha sido superado por la locura.<br>
          <span class="endgame-reason">${razon} ha llegado a su límite.</span>
        </p>
        <p class="endgame-sub">El sanatorio te reclamará... tarde o temprano.</p>
        <button class="endgame-btn">Volver al Menú Principal</button>
      </div>
    `;
    overlay.querySelector(".endgame-btn").addEventListener("click", () => {
      overlay.remove();
      onMenuCallback();
    });
    document.body.appendChild(overlay);
  }

  dibujarModalDecisionPostCura(onSiguiente, onTrago, onAbandonar) {
    let overlay = document.getElementById("decision-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "decision-overlay";
      overlay.className = "decision-overlay";
      document.body.appendChild(overlay);
    }

    let segundosRestantes = 20;
    let intervalo = null;

    const limpiar = () => {
      if (intervalo) clearInterval(intervalo);
      overlay.style.display = "none";
    };

    overlay.innerHTML = `
      <div class="decision-box">
        <h3 class="decision-title">Paciente Estabilizado</h3>
        <p class="decision-body">El paciente ha superado la crisis. ¿Qué deseas hacer?</p>
        <div class="decision-timer">
          <span class="timer-icon">&#x23f1;</span>
          <span class="timer-value" id="timer-value">${segundosRestantes}</span>
          <span class="timer-label">segundos</span>
        </div>
        <div class="decision-buttons">
          <button class="decision-btn primary" id="dec-siguiente">Siguiente Paciente</button>
          <button class="decision-btn drink" id="dec-trago">Tomar un Trago</button>
          <button class="decision-btn abandon" id="dec-abandonar">Abandonar</button>
        </div>
      </div>
    `;
    overlay.style.display = "flex";

    document.getElementById("dec-siguiente").addEventListener("click", () => {
      limpiar();
      onSiguiente();
    });
    document.getElementById("dec-trago").addEventListener("click", () => {
      limpiar();
      onTrago();
    });
    document.getElementById("dec-abandonar").addEventListener("click", () => {
      limpiar();
      onAbandonar();
    });

    intervalo = setInterval(() => {
      segundosRestantes--;
      const timerEl = document.getElementById("timer-value");
      if (timerEl) timerEl.textContent = segundosRestantes;
      if (segundosRestantes <= 0) {
        limpiar();
        onSiguiente();
      }
    }, 1000);
  }

  mostrarEfectoTrago(efecto, onComplete) {
    const overlay = document.createElement("div");
    overlay.className = "drink-overlay";
    const positive = efecto.buenEfecto === true;
    overlay.innerHTML = `
      <div class="drink-box">
        <h3 class="drink-title">${positive ? "Un Trago Reparador" : "Un Trago Amargo"}</h3>
        <p class="drink-effect ${positive ? "positive" : "negative"}">
          ${positive ? "+" : "-"}${efecto.valor}
        </p>
        <p class="drink-body">
          ${
            positive
              ? "El brebaje ayuda a tu estado psicológico."
              : "El trago te sienta mal y te deja más agotado."
          }
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.remove();
      if (onComplete) onComplete();
    }, 2000);
  }

  mostrarEventoAleatorio(evento) {
    const toast = document.createElement("div");
    toast.className = "event-toast";
    const nombresPersonaje = {
      guardia: "Guardia",
      enfermero: "Enfermero",
      doctor: "Doctor",
      alumno: "Alumno",
    };
    toast.innerHTML = `
      <div class="event-toast-header">
        <span class="event-toast-personaje">${nombresPersonaje[evento.personaje] || evento.personaje}</span>
      </div>
      <strong class="event-toast-title">${evento.titulo}</strong>
      <p class="event-toast-desc">${evento.descripcion}</p>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  dibujarRegistroEnemigo(registro) {
    const contenedor = document.getElementById("enemy-reaction");
    if (!contenedor) return;

    const ultimo = Array.isArray(registro) ? registro[0] : null;
    if (!ultimo) {
      contenedor.textContent = "";
      contenedor.classList.remove("is-visible");
      return;
    }

    const partes = [];
    if (ultimo.dañoNeto > 0) partes.push(`${ultimo.dañoNeto} de daño`);
    if (ultimo.escudoAbsorbido > 0)
      partes.push(`${ultimo.escudoAbsorbido} absorbidos por tu escudo`);
    if (ultimo.escudoEnemigo > 0) partes.push(`${ultimo.escudoEnemigo} inevitables`);

    const resumen =
      partes.length > 0 ? `Te ha hecho ${partes.join(" y ")}` : "No te ha hecho daño visible";
    contenedor.textContent = resumen;
    contenedor.classList.add("is-visible");

    clearTimeout(contenedor._hideTimer);
    contenedor._hideTimer = setTimeout(() => {
      contenedor.classList.remove("is-visible");
      contenedor.textContent = "";
    }, 3000);
  }

  dibujarModalNarrativo(nodo, onOptionCallback) {
    let modal = document.getElementById("narrative-modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "narrative-modal";
      modal.className = "narrative-overlay";
      const content = document.createElement("div");
      content.className = "narrative-box";
      content.innerHTML = `
        <h3 class="narrative-title">Examen de Diagnóstico</h3>
        <p id="narrative-text"></p>
        <div class="options-container" id="narrative-options"></div>
      `;
      modal.appendChild(content);
      document.body.appendChild(modal);
    }

    modal.className = "narrative-overlay active";
    modal.style.display = "flex";
    modal.querySelector("#narrative-text").textContent = nodo.pregunta;

    const optionsBox = modal.querySelector("#narrative-options");
    optionsBox.innerHTML = "";

    nodo.opciones.forEach((o) => {
      const btn = document.createElement("button");
      btn.className = "dialog-btn";
      btn.textContent = o.texto;

      btn.addEventListener("click", () => {
        modal.className = "narrative-overlay";
        modal.style.display = "none";
        onOptionCallback(o);
      });
      optionsBox.appendChild(btn);
    });
  }
}
