(function () {
  "use strict";

  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  let googleMapsReady = false;

  let googleMapsCarregando = false;
  let googleMapsCarregado = false;

  async function carregarGoogleMaps() {
    if (googleMapsCarregado) return;
    if (googleMapsCarregando) return;

    if (window.google && window.google.maps && window.google.maps.Map) {
      googleMapsReady = true;
      googleMapsCarregado = true;
      return;
    }

    googleMapsCarregando = true;

    try {
      const response = await fetch("/api/config");
      const config = await response.json();

      if (!config.googleMapsApiKey) {
        console.error("API Key não configurada");
        googleMapsCarregando = false;
        return;
      }

      window.initGoogleMaps = function () {
        googleMapsReady = true;
        googleMapsCarregado = true;
        googleMapsCarregando = false;
        if (parseHash().path === "mapa") {
          setTimeout(initMapa, 100);
        }
      };

      window.gm_authFailure = function () {
        console.error("Falha na autenticação do Google Maps - InvalidKey");
        googleMapsCarregando = false;
        showToast("Erro: Chave do Google Maps inválida. Verifique o console.");
      };

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&libraries=visualization&callback=initGoogleMaps&v=weekly`;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-script";

      script.onerror = () => {
        console.error("Erro ao carregar script do Google Maps");
        googleMapsCarregando = false;
      };

      document.head.appendChild(script);

    } catch (error) {
      console.error("Erro ao carregar Google Maps:", error);
      googleMapsCarregando = false;
    }
  }

  carregarGoogleMaps();

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function atualizarFavicon() {
    const theme = document.documentElement.getAttribute("data-theme");
    const favicon = document.getElementById("favicon");
    if (favicon) {
      favicon.href = theme === "dark" ? "/img/logo_noite.png" : "/img/logo_dia.png";
    }
  }

  function icon(name, size = 20) {
    const s = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    const paths = {
      map: `<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/>`,
      shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
      bell: `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,
      chart: `<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-4"/>`,
      lock: `<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
      pin: `<path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>`,
      check: `<path d="M20 6 9 17l-5-5"/>`,
      chat: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
      users: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/>`,
      eye: `<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>`,
      send: `<path d="m22 2-7 20-4-9-9-4 20-7z"/>`,
      search: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
      clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
      layers: `<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>`,
      user: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    };
    return `<svg ${s} aria-hidden="true">${paths[name] || ""}</svg>`;
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-visible");
      setTimeout(() => (toastEl.hidden = true), 300);
    }, 2800);
  }

  function initTheme() {
    const saved = localStorage.getItem("sentinela-theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const theme = saved || (prefersLight ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
    atualizarFavicon();

    $("#theme-toggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("sentinela-theme", next);
      atualizarFavicon();
      if (window.__sentinelaMap) applyMapTheme();
    });
  }

  // function initTheme() {
  //   const saved = localStorage.getItem("sentinela-theme");
  //   const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  //   const theme = saved || (prefersLight ? "light" : "dark");
  //   document.documentElement.setAttribute("data-theme", theme);

  //   $("#theme-toggle").addEventListener("click", () => {
  //     const current = document.documentElement.getAttribute("data-theme");
  //     const next = current === "dark" ? "light" : "dark";
  //     document.documentElement.setAttribute("data-theme", next);
  //     localStorage.setItem("sentinela-theme", next);
  //     if (window.__sentinelaMap) applyMapTheme();
  //   });
  // }

  function initMobileNav() {
    const toggle = $("#nav-toggle");
    const menu = $("#nav-mobile");
    toggle.addEventListener("click", () => {
      const open = !menu.hidden;
      menu.hidden = open;
      toggle.setAttribute("aria-expanded", String(!open));
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest("[data-nav]")) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function pageInicio() {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) return "<p>Carregando dados...</p>";

    const totalHoje = DATA.ocorrencias.length;
    const altos = DATA.ocorrencias.filter((o) => o.severidade === "alto").length;

    return `
      <section class="hero">
        <div class="container hero__grid">
          <div>
            <span class="eyebrow">${icon("shield", 14)} Segurança pública colaborativa</span>
            <h1 class="hero__title">Cidades mais seguras com <span>dados</span> e <span>participação cidadã</span></h1>
            <p class="hero__lead">O Sentinela integra o mapeamento de ocorrências em tempo real com um canal de denúncias anônimas protegido, conectando cidadãos e investigadores de forma segura.</p>
            <div class="hero__cta">
              <a href="#/mapa" class="btn btn--primary btn--lg" data-nav>${icon("map", 18)} Ver mapa de ocorrências</a>
              <a href="#/denuncias" class="btn btn--ghost btn--lg" data-nav>${icon("lock", 18)} Fazer denúncia anônima</a>
            </div>
            <div class="hero__stats">
              <div class="hero__stat"><strong>${totalHoje}</strong><span>Ocorrências mapeadas hoje</span></div>
              <div class="hero__stat"><strong>${altos}</strong><span>Zonas de risco alto</span></div>
              <div class="hero__stat"><strong>100%</strong><span>Denúncias anônimas</span></div>
            </div>
          </div>

          <div class="hero__panel" aria-hidden="true">
            <div class="hero__panel-bar">
              <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
              <span class="hero__panel-title">Alertas em tempo real</span>
            </div>
            <div class="hero__panel-body">
              ${DATA.ocorrencias.slice(0, 4).map((o) => `
                <div class="mini-row mini-row--clickable" data-ocorrencia="${o.id}" style="cursor: pointer;">
                  <span class="mini-badge badge--${o.severidade}">${DATA.severidades[o.severidade].nome}</span>
                  <div class="mini-row__txt">
                    <strong>${o.titulo}</strong>
                    <span>${o.bairro} · ${o.tempo}</span>
                  </div>
                  ${icon("pin", 18)}
                </div>`).join("")}
            </div>
            <!--div class="hero__panel-body">
              ${DATA.ocorrencias.slice(0, 4).map((o) => `
                <div class="mini-row">
                  <span class="mini-badge badge--${o.severidade}">${DATA.severidades[o.severidade].nome}</span>
                  <div class="mini-row__txt">
                    <strong>${o.titulo}</strong>
                    <span>${o.bairro} · ${o.tempo}</span>
                  </div>
                  ${icon("pin", 18)}
                </div>`).join("")}
            </div-->
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section__head">
            <span class="eyebrow">${icon("layers", 14)} Duas plataformas, um objetivo</span>
            <h2 class="section__title">Ferramentas complementares para segurança e cidadania</h2>
            <p class="section__desc">Uma solução unificada que centraliza informações, agiliza a resposta das autoridades e protege quem colabora.</p>
          </div>

          <div class="platforms">
            <article class="platform">
              <span class="card__icon">${icon("map")}</span>
              <p class="platform__tag">Plataforma 1</p>
              <h3 class="card__title">Mapeamento de ocorrências</h3>
              <p class="card__desc">Registro e visualização geográfica de ocorrências em tempo real, com mapa de calor e alertas proativos.</p>
              <ul>
                <li>${icon("check", 16)} Geolocalização precisa das ocorrências</li>
                <li>${icon("check", 16)} Mapa de calor de zonas de risco</li>
                <li>${icon("check", 16)} Alertas em tempo real por região</li>
                <li>${icon("check", 16)} Dados georreferenciados para análise</li>
              </ul>
              <a href="#/mapa" class="btn btn--soft" data-nav>Abrir mapa ${icon("pin", 16)}</a>
            </article>

            <article class="platform">
              <span class="card__icon">${icon("lock")}</span>
              <p class="platform__tag">Plataforma 2</p>
              <h3 class="card__title">Denúncias anônimas</h3>
              <p class="card__desc">Canal seguro para denúncias com código anônimo e chat criptografado entre denunciante e investigador.</p>
              <ul>
                <li>${icon("check", 16)} Identidade totalmente protegida</li>
                <li>${icon("check", 16)} Código anônimo de acompanhamento</li>
                <li>${icon("check", 16)} Chat seguro com o investigador</li>
                <li>${icon("check", 16)} Anexos e detalhes da ocorrência</li>
              </ul>
              <a href="#/denuncias" class="btn btn--soft" data-nav>Fazer denúncia ${icon("shield", 16)}</a>
            </article>
          </div>
        </div>
      </section>

      <section class="section section--tight">
        <div class="container">
          <div class="section__head">
            <h2 class="section__title">Como o Sentinela ajuda</h2>
          </div>
          <div class="feature-grid">
            <div class="card">
              <span class="card__icon">${icon("bell")}</span>
              <h3 class="card__title">Alertas proativos</h3>
              <p class="card__desc">Cidadãos em áreas de risco recebem alertas e podem tomar precauções com antecedência.</p>
            </div>
            <div class="card">
              <span class="card__icon">${icon("chart")}</span>
              <h3 class="card__title">Dados para decisão</h3>
              <p class="card__desc">Informações georreferenciadas subsidiam políticas públicas de segurança mais eficazes.</p>
            </div>
            <div class="card">
              <span class="card__icon">${icon("users")}</span>
              <h3 class="card__title">Participação cidadã</h3>
              <p class="card__desc">Qualquer pessoa pode registrar ocorrências e colaborar no combate à criminalidade.</p>
            </div>
            <div class="card">
              <span class="card__icon">${icon("eye")}</span>
              <h3 class="card__title">Sigilo garantido</h3>
              <p class="card__desc">A investigação recebe informações cruciais sem nunca expor o denunciante.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="container">
        <div class="cta-band">
          <div>
            <h2>Viu algo? Sua colaboração faz a diferença.</h2>
            <p>Registre uma ocorrência no mapa ou faça uma denúncia anônima em segundos.</p>
          </div>
          <div class="hero__cta" style="margin:0">
            <a href="#/mapa" class="btn btn--ghost" data-nav>Registrar ocorrência</a>
            <a href="#/denuncias" class="btn btn--primary" data-nav>Denúncia anônima</a>
          </div>
        </div>
      </section>
    `;
  }

  function pageMapa() {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) return "<p>Carregando dados...</p>";

    const tiposChips = DATA.tipos
      .map((t) => `<button class="chip is-active" data-tipo="${t.id}" type="button">${t.nome}</button>`)
      .join("");

    return `
      <section class="page-head">
        <div class="container page-head__row">
          <div>
            <h1 class="page-title">Mapa de ocorrências</h1>
            <p class="page-sub">Visualize ocorrências em tempo real, filtre por tipo e severidade e registre um novo relato.</p>
          </div>
          <button class="btn btn--primary" id="btn-registrar" type="button">${icon("pin", 18)} Registrar ocorrência</button>
        </div>
      </section>

      <section class="container">
        <div class="map-layout">
          <aside class="map-sidebar">
            <div class="stat-cards">
              <div class="stat"><div class="stat__value" id="stat-total">0</div><div class="stat__label">Ocorrências</div></div>
              <div class="stat"><div class="stat__value is-danger" id="stat-alto">0</div><div class="stat__label">Risco alto</div></div>
            </div>

            <div class="card" style="padding:18px">
              <div class="filter-group" style="margin-bottom:16px">
                <span class="filter-group__label">Severidade</span>
                <div class="chip-row" id="filtro-severidade">
                  <button class="chip is-active " data-sev="alto" type="button">Alto</button>
                  <button class="chip is-active" data-sev="medio" type="button">Médio</button>
                  <button class="chip is-active" data-sev="baixo" type="button">Baixo</button>
                </div>
              </div>
              <div class="filter-group">
                <span class="filter-group__label">Tipo de ocorrência</span>
                <div class="chip-row" id="filtro-tipo">${tiposChips}</div>
              </div>
            </div>

            <div class="card" style="padding:18px">
              <span class="filter-group__label" style="display:block;margin-bottom:12px">Ocorrências recentes</span>
              <div class="occ-list" id="occ-list"></div>
            </div>
          </aside>

            <div class="map-wrap">
              <div id="map" role="application" aria-label="Mapa de ocorrências"></div>
              <div class="map-controls">
                <button class="map-control-btn" id="btn-heatmap" type="button" title="Ativar mapa de calor">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                  </svg>
                  Mapa de calor
                </button>
              </div>
              <div class="map-legend">
                <div class="map-legend__row"><span class="legend-dot" style="background:${DATA.severidades.alto.cor}"></span> Risco alto</div>
                <div class="map-legend__row"><span class="legend-dot" style="background:${DATA.severidades.medio.cor}"></span> Risco médio</div>
                <div class="map-legend__row"><span class="legend-dot" style="background:${DATA.severidades.baixo.cor}"></span> Risco baixo</div>
              </div>
            </div>
        </div>
      </section>
    `;
  }

  function pageDenuncias() {
    const DATA = window.SENTINELA_DATA;

    if (!DATA || !DATA.tipos) {
      return "<p>Carregando dados...</p>";
    }

    const tipoOpts = DATA.tipos.map((t) => {
      return `<option value="${t.id}">${t.nome}</option>`;
    }).join("");

    return `
      <section class="page-head">
        <div class="container">
          <span class="eyebrow">${icon("lock", 14)} Canal 100% anônimo</span>
          <h1 class="page-title" style="margin-top:12px">Denúncia anônima</h1>
          <p class="page-sub">Preencha os detalhes abaixo. Não coletamos seu nome, e-mail ou qualquer dado que possa identificar você.</p>
        </div>
      </section>

      <section class="container">
        <div class="form-grid">
          <form class="card card--pad-lg" id="form-denuncia" novalidate>
            <div class="field">
              <label for="tipo">Tipo de ocorrência</label>
              <select class="select" id="tipo" required>
                <option value="" disabled selected>Selecione o tipo</option>
                ${tipoOpts}
              </select>
            </div>

            <div class="field">
              <label>Gravidade percebida</label>
              <div class="severity-options">
                <label class="severity-opt"><input type="radio" name="sev" value="baixo"><strong>Baixo</strong><span>Sem urgência</span></label>
                <label class="severity-opt"><input type="radio" name="sev" value="medio" checked><strong>Médio</strong><span>Requer atenção</span></label>
                <label class="severity-opt"><input type="radio" name="sev" value="alto"><strong>Alto</strong><span>Urgente</span></label>
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="bairro">Bairro / região</label>
                <input class="input" id="bairro" type="text" placeholder="Ex.: Bela Vista" required />
              </div>
              <div class="field">
                <label for="quando">Quando ocorreu</label>
                <input class="input" id="quando" type="datetime-local" />
              </div>
            </div>

            <div class="field">
              <label for="descricao">Descrição</label>
              <textarea class="textarea" id="descricao" placeholder="Descreva o que aconteceu..." required></textarea>
              <span class="hint">Não inclua nome, telefone ou dados pessoais.</span>
            </div>

            <button class="btn btn--primary btn--lg btn--block" type="submit">${icon("shield", 18)} Enviar denúncia anônima</button>
          </form>

          <aside class="aside-card">
            <div class="info-box info-box--accent">
              <h3 class="card__title" style="display:flex;gap:8px;align-items:center">${icon("lock", 18)} Sua proteção vem primeiro</h3>
              <p class="card__desc">Ao enviar, você recebe um <strong>código anônimo</strong>. Use-o para acompanhar o caso e conversar com o investigador por um chat seguro — sem nunca revelar sua identidade.</p>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function pageDenunciaEnviada(codigo) {
    return `
      <section class="container">
        <div class="chat-layout">
          <div class="card card--pad-lg code-result">
            <span class="card__icon" style="margin:0 auto 12px">${icon("check")}</span>
            <p class="code-result__label">Denúncia registrada com sucesso. Guarde seu código anônimo:</p>
            <div class="code-badge">${codigo}</div>
            <p class="card__desc" style="max-width:440px;margin:0 auto 24px">Use este código para acompanhar o andamento e conversar com o investigador. Ele não está vinculado à sua identidade.</p>
            <div class="hero__cta" style="justify-content:center;margin:0">
              <button class="btn btn--soft" id="btn-copiar" type="button">Copiar código</button>
              <a href="#/acompanhar?codigo=${codigo}" class="btn btn--primary" data-nav>Abrir chat seguro ${icon("chat", 16)}</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function pageAcompanhar(codigo) {
    if (!codigo) {
      return `
        <section class="page-head">
          <div class="container">
            <h1 class="page-title">Acompanhar denúncia</h1>
            <p class="page-sub">Informe o código anônimo recebido para acessar o chat seguro com o investigador.</p>
          </div>
        </section>
        <section class="container">
          <div class="chat-layout">
            <form class="card card--pad-lg" id="form-codigo">
              <div class="field">
                <label for="codigo">Código anônimo</label>
                <div class="input-group">
                  <span class="input-prefix">DNC-</span>
                  <input 
                    class="input input-with-prefix" 
                    id="codigo" 
                    type="text" 
                    placeholder="Ex.: 4821" 
                    autocomplete="off" 
                    required 
                    maxlength="4"
                    pattern="[0-9]*"
                  />
                </div>
                <span class="hint">O código foi exibido no momento do envio da denúncia.</span>
              </div>
              <button class="btn btn--primary btn--lg btn--block" type="submit">${icon("chat", 18)} Acessar chat seguro</button>
            </form>
          </div>
        </section>
      `;
    }

    return `
      <section class="page-head">
        <div class="container page-head__row">
          <div>
            <h1 class="page-title">Chat seguro</h1>
            <p class="page-sub">Denúncia <strong>${codigo}</strong> · comunicação criptografada e anônima.</p>
          </div>
          <a href="#/acompanhar" class="btn btn--ghost btn--sm" data-nav>Trocar código</a>
        </div>
      </section>
      <section class="container">
        <div class="chat-layout">
          <div class="chat">
            <div class="chat__head">
              <span class="chat__avatar">${icon("users")}</span>
              <div class="chat__who">
                <strong>Investigador responsável</strong>
                <span>Online</span>
              </div>
              <span class="chat__lock">${icon("lock", 15)} Criptografado</span>
            </div>
            <div class="chat__body" id="chat-body"></div>
            <form class="chat__foot" id="chat-form">
              <input class="input" id="chat-input" type="text" placeholder="Escreva sua mensagem…" autocomplete="off" aria-label="Mensagem" />
              <button class="btn btn--primary" type="submit" aria-label="Enviar">${icon("send", 18)}</button>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  function pageLogin() {
    return `
      <section class="page-head">
        <div class="container">
          <h1 class="page-title">Acesso Restrito</h1>
          <p class="page-sub">Painel do Investigador</p>
        </div>
      </section>
      <section class="container">
        <div class="chat-layout">
          <form class="card card--pad-lg" id="form-login">
            <div class="field">
              <label for="email">E-mail</label>
              <input class="input" id="email" type="email" value="admin@sentinela.com" required />
            </div>
            <div class="field">
              <label for="senha">Senha</label>
              <input class="input" id="senha" type="password" value="admin123" required />
            </div>
            <button class="btn btn--primary btn--lg btn--block" type="submit">Entrar</button>
          </form>
        </div>
      </section>
    `;
  }

  function pagePainel() {
    return `
      <section class="page-head">
        <div class="container page-head__row">
          <div>
            <h1 class="page-title">Painel do Investigador</h1>
            <p class="page-sub">Gerenciamento de denúncias</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn--soft btn--sm" id="btn-export-csv">
              ${icon("chart", 16)} Exportar CSV
            </button>
            <button class="btn btn--soft btn--sm" id="btn-export-pdf">
              ${icon("chart", 16)} Exportar PDF
            </button>
            <button class="btn btn--ghost btn--sm" id="btn-logout">Sair</button>
          </div>
        </div>
      </section>
      <section class="container">
        <div class="card card--pad-lg">
          <div id="tabela-denuncias">Carregando...</div>
        </div>
      </section>
    `;
  }

  // function pagePainel() {
  //   return `
  //     <section class="page-head">
  //       <div class="container page-head__row">
  //         <div>
  //           <h1 class="page-title">Painel do Investigador</h1>
  //           <p class="page-sub">Gerenciamento de denúncias</p>
  //         </div>
  //         <button class="btn btn--ghost btn--sm" id="btn-logout">Sair</button>
  //       </div>
  //     </section>
  //     <section class="container">
  //       <div class="card card--pad-lg">
  //         <div id="tabela-denuncias">Carregando...</div>
  //       </div>
  //     </section>
  //   `;
  // }

  function pageDashboard() {
    return `
      <section class="page-head">
        <div class="container">
          <h1 class="page-title">Dashboard de Estatísticas</h1>
          <p class="page-sub">Análise visual e tendências das ocorrências registradas</p>
        </div>
      </section>
      <section class="container" style="padding-bottom: 56px;">
        
        <div class="section__head" style="margin-top: 20px;">
          <h2 class="section__title" style="font-size: 1.3rem;">Tendências (Últimos 7 dias)</h2>
        </div>
        <div class="tendencias-grid" id="tendencias-grid">
          <p style="color: var(--text-muted);">Carregando tendências...</p>
        </div>

        <div class="section__head" style="margin-top: 40px;">
          <h2 class="section__title" style="font-size: 1.3rem;">Gráficos Detalhados</h2>
        </div>
        <div class="dashboard-grid">
          <div class="card card--pad-lg">
            <h3 class="card__title">Ocorrências por Tipo</h3>
            <div class="chart-container"><canvas id="chart-tipos"></canvas></div>
          </div>
          <div class="card card--pad-lg">
            <h3 class="card__title">Nível de Severidade</h3>
            <div class="chart-container"><canvas id="chart-severidade"></canvas></div>
          </div>
          <div class="card card--pad-lg">
            <h3 class="card__title">Top 5 Bairros</h3>
            <div class="chart-container"><canvas id="chart-bairros"></canvas></div>
          </div>
          <div class="card card--pad-lg" style="grid-column: 1 / -1;">
            <h3 class="card__title">Ocorrências nos últimos 7 dias</h3>
            <div class="chart-container" style="height: 300px;"><canvas id="chart-timeline"></canvas></div>
          </div>
        </div>
      </section>
    `;
  }

  function pagePrevisao() {
    return `
      <section class="page-head">
        <div class="container">
          <span class="eyebrow">${icon("chart", 14)} Análise Preditiva</span>
          <h1 class="page-title" style="margin-top: 12px;">Inteligência Estatística</h1>
          <p class="page-sub">Padrões detectados automaticamente nos últimos 30 dias de ocorrências</p>
        </div>
      </section>
      <section class="container" style="padding-bottom: 56px;">
        <div id="previsao-loading" style="text-align: center; padding: 40px; color: var(--text-muted);">
          Analisando padrões históricos...
        </div>
        <div id="previsao-cards" style="display: none;"></div>
        <div id="previsao-vazia" style="display: none; text-align: center; padding: 60px 20px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-faint); margin-bottom: 16px;">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <h3 style="margin-bottom: 8px;">Dados insuficientes</h3>
          <p style="color: var(--text-muted); max-width: 400px; margin: 0 auto;">
            São necessários pelo menos 30 dias de dados com ocorrências registradas para gerar previsões confiáveis.
          </p>
        </div>
      </section>
    `;
  }

  async function initPrevisao() {
    const loading = document.getElementById("previsao-loading");
    const cards = document.getElementById("previsao-cards");
    const vazia = document.getElementById("previsao-vazia");

    try {
      const res = await fetch("/api/painel/previsao", {
        headers: {
          "Authorization": "Bearer " + (localStorage.getItem("sentinela_token") || "")
        }
      });

      if (res.status === 401) {
        window.location.hash = "#/login";
        return;
      }

      const data = await res.json();
      loading.style.display = "none";

      if (!data.previsoes || data.previsoes.length === 0) {
        vazia.style.display = "block";
        return;
      }

      cards.style.display = "grid";
      cards.style.gridTemplateColumns = "repeat(auto-fit, minmax(320px, 1fr))";
      cards.style.gap = "20px";

      const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      const faixasHorarias = ["00h-06h", "06h-12h", "12h-18h", "18h-24h"];

      const html = data.previsoes.map(p => {
        const isCritico = p.risco === "critico";
        const isElevado = p.risco === "elevado";
        const isModerado = p.risco === "moderado";

        let classeCard = "previsao-card";
        let badgeCor = "var(--success)";
        let badgeTexto = "Zona Tranquila";
        let icone = "✓";

        if (isCritico) {
          classeCard += " previsao-card--critico";
          badgeCor = "var(--danger)";
          badgeTexto = "Risco Crítico";
          icone = "🔴";
        } else if (isElevado) {
          classeCard += " previsao-card--elevado";
          badgeCor = "var(--accent)";
          badgeTexto = "Risco Elevado";
          icone = "🟠";
        } else if (isModerado) {
          classeCard += " previsao-card--moderado";
          badgeCor = "#f4a63b";
          badgeTexto = "Risco Moderado";
          icone = "🟡";
        }

        const diaNome = diasSemana[p.dia_semana] || "Desconhecido";
        const faixaNome = faixasHorarias[p.faixa_horaria] || "Desconhecida";
        const isHoje = p.dia_semana === data.dia_atual;

        return `
          <div class="${classeCard}">
            <div class="previsao-header">
              <span class="previsao-badge" style="background: ${badgeCor}; color: white;">
                ${icone} ${badgeTexto}
              </span>
              ${isHoje ? '<span class="previsao-hoje">HOJE</span>' : ''}
            </div>
            <h3 class="previsao-titulo">${p.tipo_nome}</h3>
            <div class="previsao-info">
              <div class="previsao-info-item">
                <span class="previsao-info-label">📅 Quando</span>
                <span class="previsao-info-value">${diaNome} · ${faixaNome}</span>
              </div>
              <div class="previsao-info-item">
                <span class="previsao-info-label">📍 Onde</span>
                <span class="previsao-info-value">${p.bairro}</span>
              </div>
              <div class="previsao-info-item">
                <span class="previsao-info-label"> Previsão</span>
                <span class="previsao-info-value">${p.media_ocorrencias} ocorrências</span>
              </div>
            </div>
            <div class="previsao-footer">
              <span class="previsao-variacao" style="color: ${badgeCor};">
                ${p.percentual_acima > 0 ? '+' : ''}${p.percentual_acima}% acima da média
              </span>
              <span class="previsao-amostras">
                Baseado em ${p.amostras} amostras
              </span>
            </div>
          </div>
        `;
      }).join("");

      cards.innerHTML = html;

    } catch (err) {
      console.error("Erro ao carregar previsões:", err);
      loading.innerHTML = `<p style="color: var(--danger);">Erro ao carregar previsões. Tente novamente.</p>`;
    }
  }

  // function pageDashboard() {
  //   return `
  //     <section class="page-head">
  //       <div class="container">
  //         <h1 class="page-title">Dashboard de Estatísticas</h1>
  //         <p class="page-sub">Análise visual das ocorrências registradas</p>
  //       </div>
  //     </section>
  //     <section class="container" style="padding-bottom: 56px;">
  //       <div class="dashboard-grid">
  //         <div class="card card--pad-lg">
  //           <h3 class="card__title">Ocorrências por Tipo</h3>
  //           <div class="chart-container"><canvas id="chart-tipos"></canvas></div>
  //         </div>
  //         <div class="card card--pad-lg">
  //           <h3 class="card__title">Nível de Severidade</h3>
  //           <div class="chart-container"><canvas id="chart-severidade"></canvas></div>
  //         </div>
  //         <div class="card card--pad-lg">
  //           <h3 class="card__title">Top 5 Bairros</h3>
  //           <div class="chart-container"><canvas id="chart-bairros"></canvas></div>
  //         </div>
  //         <div class="card card--pad-lg" style="grid-column: 1 / -1;">
  //           <h3 class="card__title">Ocorrências nos últimos 7 dias</h3>
  //           <div class="chart-container" style="height: 300px;"><canvas id="chart-timeline"></canvas></div>
  //         </div>
  //       </div>
  //     </section>
  //   `;
  // }

  let chartsInstances = {};

  function initDashboard() {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(data => renderCharts(data))
      .catch(err => console.error(err));

    fetch("/api/tendencias")
      .then(res => res.json())
      .then(data => renderTendencias(data))
      .catch(err => console.error(err));
  }

  function renderTendencias(tendencias) {
    const container = document.getElementById("tendencias-grid");
    if (!container) return;

    if (!tendencias || tendencias.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">Dados insuficientes para análise de tendências.</p>`;
      return;
    }

    const html = tendencias.slice(0, 6).map(t => {
      const isAlta = t.status === "alta";
      const isBaixa = t.status === "baixa";
      const icon = isAlta ? "↑" : isBaixa ? "↓" : "→";
      const classe = isAlta ? "tendencia-up" : isBaixa ? "tendencia-down" : "tendencia-estavel";
      const textoStatus = isAlta ? "aumento" : isBaixa ? "redução" : "estável";

      return `
        <div class="tendencia-card">
          <div class="tendencia-info">
            <span class="tendencia-nome">${t.tipo}</span>
            <span class="tendencia-count">${t.atual} ocorrências</span>
          </div>
          <div class="tendencia-valor ${classe}">
            <span class="tendencia-icon">${icon}</span>
            <span class="tendencia-porcentagem">${t.variacao}%</span>
            <span class="tendencia-legenda">${textoStatus}</span>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = html;
  }

  // function initDashboard() {
  //   fetch("/api/dashboard")
  //     .then(res => res.json())
  //     .then(data => renderCharts(data))
  //     .catch(err => console.error(err));
  // }

  function renderCharts(data) {
    Object.values(chartsInstances).forEach(chart => chart.destroy());
    chartsInstances = {};

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDark ? "#eaf1ff" : "#101a2e";
    const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    chartsInstances.tipos = new Chart(document.getElementById("chart-tipos"), {
      type: "doughnut",
      data: {
        labels: data.tipos.map(t => t.nome),
        datasets: [{
          data: data.tipos.map(t => t.total),
          backgroundColor: ["#17b8a6", "#f4a63b", "#ef5a63", "#43c98a", "#3b82f6", "#8b5cf6"],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
    });

    chartsInstances.severidade = new Chart(document.getElementById("chart-severidade"), {
      type: "bar",
      data: {
        labels: data.severidades.map(s => s.nome),
        datasets: [{
          label: "Quantidade",
          data: data.severidades.map(s => s.total),
          backgroundColor: data.severidades.map(s => s.cor),
          borderRadius: 8
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

    chartsInstances.bairros = new Chart(document.getElementById("chart-bairros"), {
      type: "bar",
      data: {
        labels: data.bairros.map(b => b.bairro),
        datasets: [{
          label: "Ocorrências",
          data: data.bairros.map(b => b.total),
          backgroundColor: "#17b8a6",
          borderRadius: 8
        }]
      },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

    chartsInstances.timeline = new Chart(document.getElementById("chart-timeline"), {
      type: "line",
      data: {
        labels: data.timeline.map(t => {
          const d = new Date(t.dia);
          return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        }),
        datasets: [{
          label: "Ocorrências",
          data: data.timeline.map(t => t.total),
          borderColor: "#17b8a6",
          backgroundColor: "rgba(23, 184, 166, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#17b8a6"
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }

  let mapMarkers = [];
  let heatmapLayer = null;
  let heatmapAtivo = false;
  let estatisticasConfirmacoes = {};
  let tokenUsuario = null;
  const activeFilters = { sev: new Set(["alto", "medio", "baixo"]), tipo: new Set() };

  function getTokenUsuario() {
    if (tokenUsuario) return tokenUsuario;

    tokenUsuario = localStorage.getItem("sentinela_user_token");
    if (!tokenUsuario) {
      tokenUsuario = "user_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("sentinela_user_token", tokenUsuario);
    }
    return tokenUsuario;
  }

  function usuarioJaConfirmou(ocorrenciaId, tipo) {
    const chave = `confirmacao_${ocorrenciaId}`;
    const valor = localStorage.getItem(chave);
    return valor === tipo;
  }

  function marcarComoConfirmado(ocorrenciaId, tipo) {
    localStorage.setItem(`confirmacao_${ocorrenciaId}`, tipo);
  }

  async function carregarEstatisticasConfirmacoes(ids) {
    if (!ids || ids.length === 0) return {};

    try {
      const res = await fetch("/api/confirmacoes/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocorrencia_ids: ids })
      });

      if (res.ok) {
        const stats = await res.json();
        Object.assign(estatisticasConfirmacoes, stats);
        return stats;
      }
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    }
    return {};
  }

  async function registrarConfirmacao(ocorrenciaId, tipo) {
    const token = getTokenUsuario();

    try {
      const res = await fetch("/api/confirmacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ocorrencia_id: ocorrenciaId,
          tipo_confirmacao: tipo,
          token_usuario: token
        })
      });

      const data = await res.json();

      if (res.ok) {
        marcarComoConfirmado(ocorrenciaId, tipo);
        estatisticasConfirmacoes[ocorrenciaId] = {
          confirmou: parseInt(data.estatisticas.total_confirmou) || 0,
          falsa: parseInt(data.estatisticas.total_falsa) || 0
        };
        return { sucesso: true };
      } else {
        return { sucesso: false, mensagem: data.error };
      }
    } catch (err) {
      return { sucesso: false, mensagem: "Erro de conexão" };
    }
  }

  function applyMapTheme() {
    const theme = document.documentElement.getAttribute("data-theme");
    const map = window.__sentinelaMap;
    if (!map) return;

    const styles = theme === "dark" ? [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    ] : [];

    map.setOptions({ styles });
  }

  async function renderMarkers(map) {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) return;

    mapMarkers.forEach((m) => m.setMap(null));
    mapMarkers = [];

    const list = filteredOccurrences();

    const ids = list.map(o => o.id);
    await carregarEstatisticasConfirmacoes(ids);

    list.forEach((o) => {
      const cor = DATA.severidades[o.severidade].cor;
      const marker = new google.maps.Marker({
        position: { lat: o.lat, lng: o.lng },
        map: map,
        title: o.titulo,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: o.severidade === "alto" ? 13 : o.severidade === "medio" ? 10 : 8,
          fillColor: cor,
          fillOpacity: 0.35,
          strokeColor: cor,
          strokeWeight: 2,
        },
      });

      const stats = estatisticasConfirmacoes[o.id] || { confirmou: 0, falsa: 0 };
      const jaConfirmou = usuarioJaConfirmou(o.id, 'confirmou');
      const jaReportou = usuarioJaConfirmou(o.id, 'falsa');

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="confirmacoes-popup">
            <div style="font-weight:bold;margin-bottom:4px;color:black;font-size:18px;">${o.titulo}</div>
            <div style="font-size:0.9rem;color:#666;margin-bottom:8px">${o.bairro} · ${o.tempo}</div>
            <p style="margin:8px 0;font-size:0.95rem;color:#444">${o.desc}</p>
            <span style="display:inline-block;padding:4px 8px;background:${cor};color:white;border-radius:4px;font-size:0.75rem;margin-bottom:8px">${DATA.severidades[o.severidade].nome}</span>
            
            <div class="confirmacoes-stats">
              <div class="confirmacao-stat" style="color:#17b8a6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                <strong>${stats.confirmou}</strong>
                <span>confirmaram</span>
              </div>
              <div class="confirmacao-stat" style="color:#ef5a63">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                <strong>${stats.falsa}</strong>
                <span>reportaram</span>
              </div>
            </div>
            
            <div class="confirmacoes-acoes">
              <button class="btn-confirmar ${jaConfirmou ? 'ja-confirmado' : ''}" data-occ="${o.id}" data-tipo="confirmou" ${jaConfirmou || jaReportou ? 'disabled' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                ${jaConfirmou ? 'Confirmado' : 'Confirmar'}
              </button>
              <button class="btn-falsa ${jaReportou ? 'ja-reportado' : ''}" data-occ="${o.id}" data-tipo="falsa" ${jaConfirmou || jaReportou ? 'disabled' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                ${jaReportou ? 'Reportado' : 'Falsa'}
              </button>
            </div>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);

        setTimeout(() => {
          document.querySelectorAll(".btn-confirmar, .btn-falsa").forEach(btn => {
            btn.onclick = async () => {
              const occId = parseInt(btn.dataset.occ);
              const tipo = btn.dataset.tipo;

              btn.disabled = true;
              btn.innerHTML = "Enviando...";

              const resultado = await registrarConfirmacao(occId, tipo);

              if (resultado.sucesso) {
                infoWindow.close();
                await renderMarkers(map);
                showToast(tipo === 'confirmou' ? "Confirmação registrada!" : "Reporte registrado!");
              } else {
                showToast(resultado.mensagem);
                btn.disabled = false;
                btn.innerHTML = tipo === 'confirmou' ? 'Confirmar' : 'Falsa';
              }
            };
          });
        }, 100);
      });

      marker._occId = o.id;
      mapMarkers.push(marker);
    });

    const total = list.length;
    const alto = list.filter((o) => o.severidade === "alto").length;
    if ($("#stat-total")) $("#stat-total").textContent = total;
    if ($("#stat-alto")) $("#stat-alto").textContent = alto;
    renderOccList(list, map);
  }

  function toggleHeatmap(map) {
    const btn = $("#btn-heatmap");
    if (!btn) return;

    heatmapAtivo = !heatmapAtivo;

    if (heatmapAtivo) {
      // Limpa marcadores anteriores se existirem
      if (heatmapLayer) {
        heatmapLayer.forEach(m => m.setMap(null));
      }
      heatmapLayer = [];

      const ocorrencias = window.SENTINELA_DATA.ocorrencias.filter(o =>
        activeFilters.sev.has(o.severidade) && activeFilters.tipo.has(o.tipo)
      );

      // Cria círculos sobrepostos para simular heatmap
      ocorrencias.forEach(o => {
        const peso = o.severidade === "alto" ? 3 : o.severidade === "medio" ? 2 : 1;
        const cor = o.severidade === "alto" ? "#ef5a63" : o.severidade === "medio" ? "#f4a63b" : "#17b8a6";

        // Cria múltiplos círculos com opacidade decrescente para efeito de calor
        for (let i = 0; i < peso; i++) {
          const circle = new google.maps.Circle({
            strokeColor: cor,
            strokeOpacity: 0.1,
            strokeWeight: 0,
            fillColor: cor,
            fillOpacity: 0.15 - (i * 0.04),
            map: map,
            center: { lat: o.lat, lng: o.lng },
            radius: 150 + (i * 100),
          });
          heatmapLayer.push(circle);
        }
      });

      btn.classList.add("is-active");
    } else {
      // Remove todos os círculos do heatmap
      if (heatmapLayer) {
        heatmapLayer.forEach(m => m.setMap(null));
        heatmapLayer = [];
      }
      btn.classList.remove("is-active");
    }
  }

  function atualizarHeatmap() {
    if (!heatmapAtivo || !window.__sentinelaMap) return;

    // Recria o heatmap com os dados filtrados
    toggleHeatmap(window.__sentinelaMap);
  }

  // function atualizarHeatmap() {
  //   if (heatmapLayer && window.SENTINELA_DATA) {
  //     const pontos = window.SENTINELA_DATA.ocorrencias
  //       .filter(o => activeFilters.sev.has(o.severidade) && activeFilters.tipo.has(o.tipo))
  //       .map(o => {
  //         const peso = o.severidade === "alto" ? 3 : o.severidade === "medio" ? 2 : 1;
  //         return {
  //           location: new google.maps.LatLng(o.lat, o.lng),
  //           weight: peso
  //         };
  //       });
  //     heatmapLayer.setData(pontos);
  //   }
  // }

  function filteredOccurrences() {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) return [];

    const filtered = DATA.ocorrencias.filter((o) => {
      const sevMatch = activeFilters.sev.has(o.severidade);
      const tipoMatch = activeFilters.tipo.has(o.tipo);
      return sevMatch && tipoMatch;
    });

    return filtered;
  }

  function renderOccList(list, map) {
    const DATA = window.SENTINELA_DATA;
    const el = $("#occ-list");
    if (!el || !DATA) return;
    if (!list.length) {
      el.innerHTML = `<p class="card__desc">Nenhuma ocorrência com os filtros atuais.</p>`;
      return;
    }
    el.innerHTML = list
      .slice(0, 6)
      .map((o) => {
        const stats = estatisticasConfirmacoes[o.id] || { confirmou: 0, falsa: 0 };
        return `
        <button class="occ-item" data-occ="${o.id}" type="button">
          <span class="mini-badge badge--${o.severidade}">${DATA.severidades[o.severidade].nome}</span>
          <span class="occ-item__body">
            <span class="occ-item__title">${o.titulo}</span>
            <span class="occ-item__meta">${o.bairro} · ${o.tempo}</span>
            <div class="occ-item-stats">
              <span class="occ-item-stat" style="color:#17b8a6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                ${stats.confirmou}
              </span>
              <span class="occ-item-stat" style="color:#ef5a63">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                ${stats.falsa}
              </span>
            </div>
          </span>
        </button>`;
      })
      .join("");

    $$(".occ-item", el).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.occ);
        const o = DATA.ocorrencias.find((x) => x.id === id);
        const marker = mapMarkers.find((m) => m._occId === id);
        if (o && marker) {
          map.panTo({ lat: o.lat, lng: o.lng });
          map.setZoom(15);
          google.maps.event.trigger(marker, "click");
        }
      });
    });
  }

  let marcadorTemporario = null;
  let coordenadasSelecionadas = null;

  function abrirModalRegistro(lat, lng) {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) return;

    coordenadasSelecionadas = { lat, lng };

    if (marcadorTemporario) {
      marcadorTemporario.setMap(null);
    }
    marcadorTemporario = new google.maps.Marker({
      position: { lat, lng },
      map: window.__sentinelaMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#3b82f6",
        fillOpacity: 0.6,
        strokeColor: "#1d4ed8",
        strokeWeight: 2,
      },
      title: "Local selecionado",
    });

    const tipoOpts = DATA.tipos
      .map((t) => `<option value="${t.id}">${t.nome}</option>`)
      .join("");

    const modalHTML = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${icon("pin", 20)} Registrar nova ocorrência</h3>
            <button class="modal-close" id="modal-close" type="button" aria-label="Fechar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <p class="modal-info">
              ${icon("map", 16)} Local: <strong>${lat.toFixed(5)}, ${lng.toFixed(5)}</strong>
            </p>

            <div class="field">
              <label for="modal-tipo">Tipo de ocorrência *</label>
              <select class="select" id="modal-tipo" required>
                <option value="" disabled selected>Selecione o tipo</option>
                ${tipoOpts}
              </select>
            </div>

            <div class="field">
              <label>Severidade *</label>
              <div class="severity-options">
                <label class="severity-opt">
                  <input type="radio" name="modal-sev" value="baixo">
                  <strong>Baixo</strong>
                  <span>Sem urgência</span>
                </label>
                <label class="severity-opt">
                  <input type="radio" name="modal-sev" value="medio" checked>
                  <strong>Médio</strong>
                  <span>Requer atenção</span>
                </label>
                <label class="severity-opt">
                  <input type="radio" name="modal-sev" value="alto">
                  <strong>Alto</strong>
                  <span>Urgente</span>
                </label>
              </div>
            </div>

            <div class="field">
              <label for="modal-bairro">Bairro / região *</label>
              <input class="input" id="modal-bairro" type="text" placeholder="Ex.: Bela Vista" required />
            </div>

            <div class="field">
              <label for="modal-desc">Descrição *</label>
              <textarea class="textarea" id="modal-desc" rows="3" placeholder="Descreva o que aconteceu..." required></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn--ghost" id="modal-cancelar" type="button">Cancelar</button>
            <button class="btn btn--primary" id="modal-confirmar" type="button">
              ${icon("check", 18)} Registrar ocorrência
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    setTimeout(() => {
      const modalTipo = $("#modal-tipo");
      if (modalTipo) modalTipo.focus();
    }, 100);

    const modalClose = $("#modal-close");
    const modalCancelar = $("#modal-cancelar");
    const modalOverlay = $("#modal-overlay");
    const modalConfirmar = $("#modal-confirmar");

    if (modalClose) modalClose.addEventListener("click", fecharModalRegistro);
    if (modalCancelar) modalCancelar.addEventListener("click", fecharModalRegistro);
    if (modalOverlay) {
      modalOverlay.addEventListener("click", (e) => {
        if (e.target.id === "modal-overlay") fecharModalRegistro();
      });
    }
    if (modalConfirmar) modalConfirmar.addEventListener("click", confirmarRegistroOcorrencia);

    document.addEventListener("keydown", handleEscModal);
  }

  function handleEscModal(e) {
    if (e.key === "Escape") {
      fecharModalRegistro();
      document.removeEventListener("keydown", handleEscModal);
    }
  }

  function fecharModalRegistro() {
    const modal = $("#modal-overlay");
    if (modal) {
      modal.classList.add("modal-closing");
      setTimeout(() => {
        if (modal.parentNode) modal.remove();
      }, 200);
    }

    if (marcadorTemporario) {
      marcadorTemporario.setMap(null);
      marcadorTemporario = null;
    }
    coordenadasSelecionadas = null;
    document.removeEventListener("keydown", handleEscModal);
  }

  async function confirmarRegistroOcorrencia() {
    const DATA = window.SENTINELA_DATA;
    if (!DATA || !coordenadasSelecionadas) return;

    const tipoSelect = $("#modal-tipo");
    const tipoId = tipoSelect?.value;
    const bairro = $("#modal-bairro")?.value.trim();
    const desc = $("#modal-desc")?.value.trim();
    const sevRadio = document.querySelector('input[name="modal-sev"]:checked');
    const severidade = sevRadio?.value || "medio";

    if (!tipoId) {
      showToast("Selecione o tipo de ocorrência.");
      if (tipoSelect) tipoSelect.focus();
      return;
    }
    if (!bairro) {
      showToast("Informe o bairro/região.");
      const bairroInput = $("#modal-bairro");
      if (bairroInput) bairroInput.focus();
      return;
    }
    if (!desc) {
      showToast("Adicione uma descrição.");
      const descInput = $("#modal-desc");
      if (descInput) descInput.focus();
      return;
    }

    const btnConfirmar = $("#modal-confirmar");
    if (btnConfirmar) {
      btnConfirmar.disabled = true;
      btnConfirmar.innerHTML = `${icon("pin", 18)} Salvando...`;
    }

    try {
      const response = await fetch("/api/ocorrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_id: Number(tipoId),
          severidade_id: severidade,
          titulo: `${DATA.tipos.find(t => t.id === Number(tipoId))?.nome || "Ocorrência"} registrada`,
          bairro: bairro,
          tempo: "agora",
          lat: coordenadasSelecionadas.lat,
          lng: coordenadasSelecionadas.lng,
          descricao: desc,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao registrar ocorrência");
      }

      const novaOcorrencia = {
        id: responseData.id || Date.now(),
        tipo: tipoId,
        severidade: severidade,
        titulo: `${DATA.tipos.find(t => t.id === Number(tipoId))?.nome || "Ocorrência"} registrada`,
        bairro: bairro,
        tempo: "agora",
        lat: coordenadasSelecionadas.lat,
        lng: coordenadasSelecionadas.lng,
        desc: desc,
      };

      DATA.ocorrencias.unshift(novaOcorrencia);

      fecharModalRegistro();

      const btnRegistrar = $("#btn-registrar");
      if (btnRegistrar) {
        btnRegistrar.classList.add("btn--primary");
        btnRegistrar.classList.remove("btn--soft");
        btnRegistrar.innerHTML = `${icon("pin", 18)} Registrar ocorrência`;

        if (window.__sentinelaMap) {
          window.__sentinelaMap.getDiv().style.cursor = "";
        }
      }

      if (window.__sentinelaMap) {
        renderMarkers(window.__sentinelaMap);
      }

      showToast("Ocorrência registrada com sucesso!");

    } catch (error) {
      console.error("Erro ao registrar ocorrência:", error);
      showToast("Erro ao registrar: " + error.message);
      if (btnConfirmar) {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = `${icon("check", 18)} Registrar ocorrência`;
      }
    }
  }

  async function initMapa() {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) {
      setTimeout(initMapa, 500);
      return;
    }

    if (!googleMapsReady) {
      setTimeout(initMapa, 500);
      return;
    }

    const mapElement = document.getElementById("map");
    if (!mapElement) {
      setTimeout(initMapa, 500);
      return;
    }

    if (window.__sentinelaMap) {
      return;
    }

    try {
      activeFilters.sev = new Set(["alto", "medio", "baixo"]);
      activeFilters.tipo = new Set(DATA.tipos.map((t) => t.id.toString()));

      const map = new google.maps.Map(mapElement, {
        center: { lat: DATA.center[0], lng: DATA.center[1] },
        zoom: DATA.zoom,
        disableDefaultUI: false,
        zoomControl: true,
        scrollwheel: true,
      });

      window.__sentinelaMap = map;
      applyMapTheme();
      await renderMarkers(map);

      // Verifica se há uma ocorrência para destacar
      const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
      const ocorrenciaId = params.get("ocorrencia");

      if (ocorrenciaId) {
        const id = parseInt(ocorrenciaId);
        const ocorrencia = DATA.ocorrencias.find(o => o.id === id);

        if (ocorrencia) {
          // Centraliza no marcador
          map.panTo({ lat: ocorrencia.lat, lng: ocorrencia.lng });
          map.setZoom(16);

          // Encontra e clica no marcador após um pequeno delay
          setTimeout(() => {
            const marker = mapMarkers.find(m => m._occId === id);
            if (marker) {
              google.maps.event.trigger(marker, "click");
            }
          }, 300);
        }
      }

      const btnHeatmap = $("#btn-heatmap");
      if (btnHeatmap) {
        btnHeatmap.addEventListener("click", () => toggleHeatmap(map));
      }

      $$("#filtro-severidade .chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const s = chip.dataset.sev;
          chip.classList.toggle("is-active");

          if (chip.classList.contains("is-active")) {
            activeFilters.sev.add(s);
          } else {
            activeFilters.sev.delete(s);
          }

          renderMarkers(map);
          atualizarHeatmap();
        });
      });

      $$("#filtro-tipo .chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const t = chip.dataset.tipo;
          chip.classList.toggle("is-active");

          if (chip.classList.contains("is-active")) {
            activeFilters.tipo.add(t);
          } else {
            activeFilters.tipo.delete(t);
          }

          renderMarkers(map);
          atualizarHeatmap();
        });
      });

      let modoRegistro = false;
      const btn = $("#btn-registrar");

      if (btn) {
        btn.addEventListener("click", () => {
          modoRegistro = !modoRegistro;

          if (modoRegistro) {
            btn.classList.remove("btn--primary");
            btn.classList.add("btn--soft");
            btn.innerHTML = `${icon("pin", 18)} Clique no mapa para selecionar o local`;
            map.getDiv().style.cursor = "crosshair";
            showToast("Clique no mapa para selecionar o local da ocorrência");
          } else {
            btn.classList.add("btn--primary");
            btn.classList.remove("btn--soft");
            btn.innerHTML = `${icon("pin", 18)} Registrar ocorrência`;
            map.getDiv().style.cursor = "";

            if (marcadorTemporario) {
              marcadorTemporario.setMap(null);
              marcadorTemporario = null;
            }
          }
        });

        map.addListener("click", (e) => {
          if (!modoRegistro) return;
          abrirModalRegistro(e.latLng.lat(), e.latLng.lng());
        });
      }

    } catch (error) {
      console.error("Erro ao inicializar mapa:", error);
      showToast("Erro ao carregar o mapa: " + error.message);
    }
  }

  // async function initMapa() {
  //   const DATA = window.SENTINELA_DATA;
  //   if (!DATA) {
  //     setTimeout(initMapa, 500);
  //     return;
  //   }

  //   if (!googleMapsReady) {
  //     setTimeout(initMapa, 500);
  //     return;
  //   }

  //   const mapElement = document.getElementById("map");
  //   if (!mapElement) {
  //     setTimeout(initMapa, 500);
  //     return;
  //   }

  //   if (window.__sentinelaMap) {
  //     return;
  //   }

  //   try {
  //     activeFilters.sev = new Set(["alto", "medio", "baixo"]);
  //     activeFilters.tipo = new Set(DATA.tipos.map((t) => t.id.toString()));

  //     const map = new google.maps.Map(mapElement, {
  //       center: { lat: DATA.center[0], lng: DATA.center[1] },
  //       zoom: DATA.zoom,
  //       disableDefaultUI: false,
  //       zoomControl: true,
  //       scrollwheel: true,
  //     });

  //     window.__sentinelaMap = map;
  //     applyMapTheme();
  //     await renderMarkers(map);

  //     const btnHeatmap = $("#btn-heatmap");
  //     if (btnHeatmap) {
  //       btnHeatmap.addEventListener("click", () => toggleHeatmap(map));
  //     }

  //     $$("#filtro-severidade .chip").forEach((chip) => {
  //       chip.addEventListener("click", () => {
  //         const s = chip.dataset.sev;
  //         chip.classList.toggle("is-active");
  //         if (chip.classList.contains("is-active")) {
  //           activeFilters.sev.add(s);
  //         } else {
  //           activeFilters.sev.delete(s);
  //         }
  //         renderMarkers(map);
  //         atualizarHeatmap();
  //       });
  //     });

  //     $$("#filtro-tipo .chip").forEach((chip) => {
  //       chip.addEventListener("click", () => {
  //         const t = chip.dataset.tipo;
  //         chip.classList.toggle("is-active");
  //         if (chip.classList.contains("is-active")) {
  //           activeFilters.tipo.add(t);
  //         } else {
  //           activeFilters.tipo.delete(t);
  //         }
  //         renderMarkers(map);
  //         atualizarHeatmap();
  //       });
  //     });

  //     let modoRegistro = false;
  //     const btn = $("#btn-registrar");

  //     if (btn) {
  //       btn.addEventListener("click", () => {
  //         modoRegistro = !modoRegistro;
  //         if (modoRegistro) {
  //           btn.classList.remove("btn--primary");
  //           btn.classList.add("btn--soft");
  //           btn.innerHTML = `${icon("pin", 18)} Clique no mapa para selecionar o local`;
  //           map.getDiv().style.cursor = "crosshair";
  //           showToast("Clique no mapa para selecionar o local da ocorrência");
  //         } else {
  //           btn.classList.add("btn--primary");
  //           btn.classList.remove("btn--soft");
  //           btn.innerHTML = `${icon("pin", 18)} Registrar ocorrência`;
  //           map.getDiv().style.cursor = "";
  //           if (marcadorTemporario) {
  //             marcadorTemporario.setMap(null);
  //             marcadorTemporario = null;
  //           }
  //         }
  //       });

  //       map.addListener("click", (e) => {
  //         if (!modoRegistro) return;
  //         abrirModalRegistro(e.latLng.lat(), e.latLng.lng());
  //       });
  //     }

  //   } catch (error) {
  //     console.error("Erro ao inicializar mapa:", error);
  //     showToast("Erro ao carregar o mapa: " + error.message);
  //   }
  // }

  function initDenuncia() {
    const form = $("#form-denuncia");
    if (!form) {
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const tipoSelect = $("#tipo");
      const tipoValue = tipoSelect?.value;
      const bairro = $("#bairro")?.value.trim();
      const desc = $("#descricao")?.value.trim();
      const sevRadio = document.querySelector('input[name="sev"]:checked');
      const sev = sevRadio?.value || "medio";
      const quando = $("#quando")?.value;

      if (!tipoValue || tipoValue === "" || tipoValue === "null") {
        showToast("Selecione o tipo de ocorrência.");
        return;
      }

      if (!bairro || !desc) {
        showToast("Preencha bairro e descrição.");
        return;
      }

      const tipoId = Number(tipoValue);

      if (isNaN(tipoId)) {
        showToast("Tipo de ocorrência inválido.");
        return;
      }

      const payload = {
        tipo_id: tipoId,
        severidade_id: sev,
        bairro: bairro,
        quando_ocorreu: quando || null,
        descricao: desc,
      };

      try {
        const response = await fetch("/api/denuncias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || "Erro ao enviar denúncia");
        }

        window.location.hash = "#/denuncia-enviada?codigo=" + responseData.codigo;
      } catch (error) {
        console.error("Erro ao enviar denúncia:", error);
        showToast("Erro ao enviar denúncia: " + error.message);
      }
    });
  }

  function initDenunciaEnviada() {
    const btn = $("#btn-copiar");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const code = $(".code-badge").textContent.trim();
      navigator.clipboard?.writeText(code).then(
        () => showToast("Código copiado."),
        () => showToast("Copie manualmente: " + code)
      );
    });
  }

  function initAcompanhar(codigo) {
    if (!codigo) {
      const form = $("#form-codigo");
      if (!form) {
        return;
      }

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputCodigo = $("#codigo");
        if (!inputCodigo) {
          return;
        }

        let c = inputCodigo.value.trim().toUpperCase();

        if (!c.startsWith("DNC-")) {
          c = "DNC-" + c;
        }

        const codigoLimpo = c.replace(/[^A-Z0-9-]/g, "");

        if (!codigoLimpo || codigoLimpo === "DNC-") {
          showToast("Informe o código completo.");
          return;
        }

        window.location.hash = "#/acompanhar?codigo=" + encodeURIComponent(codigoLimpo);
      });

      const inputCodigo = $("#codigo");
      if (inputCodigo) {
        inputCodigo.addEventListener("input", (e) => {
          let val = e.target.value.replace(/[^0-9]/g, "");
          e.target.value = val;
        });

        inputCodigo.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && e.target.value.length === 0) {
            e.preventDefault();
          }
        });
      }

      return;
    }
    initChat(codigo);
  }

  async function initChat(codigo) {
    const body = $("#chat-body");
    const form = $("#chat-form");
    const input = $("#chat-input");

    if (!body || !form || !input) {
      return;
    }

    body.innerHTML = "";

    let denunciaId = null;

    function addBubble({ autor, texto, hora, nome }) {
      const div = document.createElement("div");
      if (autor === "system") {
        div.className = "bubble bubble--system";
        div.textContent = texto;
      } else {
        div.className = "bubble " + (autor === "out" ? "bubble--out" : "bubble--in");
        div.innerHTML = `${texto}<span class="bubble__time">${hora || agora()}</span>`;
      }
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    function agora() {
      const d = new Date();
      return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    }

    try {
      const url = `/api/chat-by-codigo/${encodeURIComponent(codigo)}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Denúncia não encontrada");
      }

      const data = await response.json();
      denunciaId = data.denuncia.id;

      if (data.mensagens && data.mensagens.length > 0) {
        data.mensagens.forEach(msg => {
          addBubble({
            autor: msg.autor,
            texto: msg.texto,
            hora: msg.hora,
            nome: msg.nome_remetente
          });
        });
      } else {
        const msg1 = {
          autor: "system",
          texto: "Canal seguro estabelecido. Sua identidade permanece protegida.",
          hora: agora()
        };
        const msg2 = {
          autor: "in",
          texto: "Olá. Recebemos sua denúncia (" + codigo + "). Pode confirmar o período em que a atividade costuma ocorrer?",
          hora: agora(),
          nome: "Investigador"
        };

        await fetch("/api/chat-mensagem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ denuncia_id: denunciaId, autor: msg1.autor, texto: msg1.texto, hora: msg1.hora })
        });

        await fetch("/api/chat-mensagem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ denuncia_id: denunciaId, autor: msg2.autor, texto: msg2.texto, hora: msg2.hora })
        });

        addBubble(msg1);
        addBubble(msg2);
      }

    } catch (error) {
      console.error("Erro ao carregar chat:", error);
      addBubble({ autor: "system", texto: "Erro ao carregar o chat. Verifique se o código está correto." });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;

      const horaEnvio = agora();
      addBubble({ autor: "out", texto: val, hora: horaEnvio });
      input.value = "";

      if (!denunciaId) {
        showToast("Erro: denúncia não identificada");
        return;
      }

      try {
        const response = await fetch("/api/chat-mensagem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ denuncia_id: denunciaId, autor: "out", texto: val, hora: horaEnvio })
        });

        if (!response.ok) {
          throw new Error("Erro ao enviar mensagem");
        }

        const data = await response.json();

        if (data.resposta) {
          setTimeout(() => {
            addBubble({
              autor: data.resposta.autor,
              texto: data.resposta.texto,
              hora: data.resposta.hora,
              nome: "Investigador"
            });
          }, 900 + Math.random() * 800);
        }

      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        showToast("Erro ao enviar mensagem");
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (e.nativeEvent?.isComposing || e.keyCode === 229) return;
      }
    });
  }

  function initLogin() {
    const form = $("#form-login");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#email").value;
      const senha = $("#senha").value;

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha })
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("sentinela_token", data.token);
          window.location.hash = "#/painel";
        } else {
          showToast(data.error);
        }
      } catch (err) {
        showToast("Erro de conexão");
      }
    });
  }

  function initPainel() {
    const token = localStorage.getItem("sentinela_token");
    if (!token) {
      window.location.hash = "#/login";
      return;
    }

    const btnLogout = $("#btn-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        localStorage.removeItem("sentinela_token");
        window.location.hash = "#/inicio";
      });
    }

    const btnExportCSV = $("#btn-export-csv");
    if (btnExportCSV) {
      btnExportCSV.addEventListener("click", () => {
        window.open("/api/painel/relatorio/csv?token=" + token, "_blank");
      });
    }

    const btnExportPDF = $("#btn-export-pdf");
    if (btnExportPDF) {
      btnExportPDF.addEventListener("click", () => {
        window.open("/api/painel/relatorio/pdf?token=" + token, "_blank");
      });
    }

    fetchDenuncias(token);
  }

  // function initPainel() {
  //   const token = localStorage.getItem("sentinela_token");
  //   if (!token) {
  //     window.location.hash = "#/login";
  //     return;
  //   }

  //   const btnLogout = $("#btn-logout");
  //   if (btnLogout) {
  //     btnLogout.addEventListener("click", () => {
  //       localStorage.removeItem("sentinela_token");
  //       window.location.hash = "#/inicio";
  //     });
  //   }

  //   fetchDenuncias(token);
  // }

  async function fetchDenuncias(token) {
    const container = $("#tabela-denuncias");
    if (!container) return;

    container.innerHTML = "Carregando...";

    try {
      const res = await fetch("/api/painel/denuncias", {
        headers: { "Authorization": "Bearer " + token }
      });

      if (res.status === 401) {
        localStorage.removeItem("sentinela_token");
        window.location.hash = "#/login";
        return;
      }

      const data = await res.json();
      renderTabelaDenuncias(data, container, token);
    } catch (err) {
      container.innerHTML = "Erro ao carregar dados.";
    }
  }

  function renderTabelaDenuncias(denuncias, container, token) {
    if (!denuncias.length) {
      container.innerHTML = "<p>Nenhuma denúncia registrada.</p>";
      return;
    }

    let html = `
      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align:left; padding:8px; border-bottom: 1px solid var(--border);">Código</th>
            <th style="text-align:left; padding:8px; border-bottom: 1px solid var(--border);">Tipo</th>
            <th style="text-align:left; padding:8px; border-bottom: 1px solid var(--border);">Bairro</th>
            <th style="text-align:left; padding:8px; border-bottom: 1px solid var(--border);">Status</th>
            <th style="text-align:left; padding:8px; border-bottom: 1px solid var(--border);">Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    denuncias.forEach(d => {
      html += `
        <tr style="border-bottom: 1px solid var(--border-soft);">
          <td style="padding:12px 8px; font-family: monospace;">${d.codigo_anonimo}</td>
          <td style="padding:12px 8px;">${d.tipo_nome}</td>
          <td style="padding:12px 8px;">${d.bairro}</td>
          <td style="padding:12px 8px;">
            <span class="mini-badge badge--${d.severidade_id === 'alto' ? 'alto' : d.severidade_id === 'medio' ? 'medio' : 'baixo'}">${d.status}</span>
          </td>
          <td style="padding:12px 8px; display: flex; gap: 8px;">
            <select class="select status-select" data-id="${d.id}" style="padding: 6px 10px; font-size: 0.85rem; flex: 1;">
              <option value="aberta" ${d.status === 'aberta' ? 'selected' : ''}>Aberta</option>
              <option value="em_analise" ${d.status === 'em_analise' ? 'selected' : ''}>Em Análise</option>
              <option value="resolvida" ${d.status === 'resolvida' ? 'selected' : ''}>Resolvida</option>
              <option value="arquivada" ${d.status === 'arquivada' ? 'selected' : ''}>Arquivada</option>
            </select>
            <button class="btn btn--soft btn--sm btn-timeline" data-id="${d.id}" style="padding: 6px 12px;">
              ${icon("clock", 16)}
            </button>
          </td>
          <!--td style="padding:12px 8px;">
            <select class="select status-select" data-id="${d.id}" style="padding: 6px 10px; font-size: 0.85rem;">
              <option value="aberta" ${d.status === 'aberta' ? 'selected' : ''}>Aberta</option>
              <option value="em_analise" ${d.status === 'em_analise' ? 'selected' : ''}>Em Análise</option>
              <option value="resolvida" ${d.status === 'resolvida' ? 'selected' : ''}>Resolvida</option>
              <option value="arquivada" ${d.status === 'arquivada' ? 'selected' : ''}>Arquivada</option>
            </select>
          </td-->
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

    container.querySelectorAll(".status-select").forEach(select => {
      select.addEventListener("change", async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.value;

        select.disabled = true;

        try {
          const res = await fetch(`/api/painel/denuncias/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ status })
          });

          if (res.ok) {
            showToast("Status atualizado");
            fetchDenuncias(token);
          } else {
            showToast("Erro ao atualizar");
            select.disabled = false;
          }
        } catch (err) {
          showToast("Erro de conexão");
          select.disabled = false;
        }
      });
    });

    container.querySelectorAll(".btn-timeline").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        abrirModalTimeline(id, token);
      });
    });
  }

  async function abrirModalTimeline(denunciaId, token) {
    console.log("Abrindo timeline para denúncia:", denunciaId);
    console.log("Token:", token ? "Presente" : "Ausente");

    const modalHTML = `
      <div class="modal-overlay" id="modal-timeline-overlay">
        <div class="modal-content modal-timeline">
          <div class="modal-header">
            <h3 class="modal-title">${icon("clock", 20)} Linha do Tempo</h3>
            <button class="modal-close" id="modal-timeline-close" type="button" aria-label="Fechar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body" id="timeline-body">
            <p style="text-align: center; color: var(--text-muted);">Carregando histórico...</p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const overlay = document.getElementById("modal-timeline-overlay");
    const btnClose = document.getElementById("modal-timeline-close");

    btnClose.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target.id === "modal-timeline-overlay") overlay.remove();
    });

    try {
      console.log("Fazendo requisição para:", `/api/timeline/${denunciaId}`);

      const res = await fetch(`/api/timeline/${denunciaId}`, {
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        }
      });

      console.log("Status da resposta:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Erro na API:", errorData);
        throw new Error(errorData.error || `Erro ${res.status}`);
      }

      const eventos = await res.json();
      console.log("Eventos recebidos:", eventos);
      renderTimeline(eventos);

    } catch (err) {
      console.error("Erro ao carregar timeline:", err);
      document.getElementById("timeline-body").innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <p style="color: var(--danger); margin-bottom: 10px;">Erro ao carregar timeline.</p>
          <p style="color: var(--text-muted); font-size: 0.85rem;">${err.message}</p>
          <button class="btn btn--primary btn--sm" onclick="abrirModalTimeline('${denunciaId}', '${token}')" style="margin-top: 10px;">
            Tentar novamente
          </button>
        </div>
      `;
    }
  }

  function renderTimeline(eventos) {
    const body = document.getElementById("timeline-body");
    if (!eventos || eventos.length === 0) {
      body.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Nenhum evento registrado ainda.</p>`;
      return;
    }

    const html = `
      <div class="timeline-container">
        ${eventos.map((e, index) => {
      const data = new Date(e.created_at);
      const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dataFormatada = data.toLocaleDateString('pt-BR');
      const isLast = index === eventos.length - 1;

      return `
            <div class="timeline-item ${isLast ? 'timeline-item--last' : ''}">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="timeline-time">${hora} · ${dataFormatada}</div>
                <div class="timeline-evento">${e.evento}</div>
                <div class="timeline-autor">Por: ${e.autor}</div>
              </div>
            </div>
          `;
    }).join("")}
      </div>
    `;

    body.innerHTML = html;
  }

  function parseHash() {
    const raw = window.location.hash.replace(/^#\//, "") || "inicio";
    const [path, query] = raw.split("?");
    const params = new URLSearchParams(query || "");
    return { path, params };
  }

  function setActiveNav(path) {
    $$(".nav__link").forEach((l) => {
      const route = l.dataset.route;
      const match =
        route === path ||
        (route === "denuncias" && path === "denuncia-enviada") ||
        (route === "acompanhar" && path === "acompanhar");
      l.classList.toggle("is-active", match);
    });
  }

  function render() {
    const { path, params } = parseHash();
    let html = "";

    switch (path) {
      case "mapa":
        html = pageMapa();
        break;
      case "denuncias":
        html = pageDenuncias();
        break;
      case "denuncia-enviada":
        html = pageDenunciaEnviada(params.get("codigo") || "DNC-0000");
        break;
      case "acompanhar":
        html = pageAcompanhar(params.get("codigo"));
        break;
      case "login":
        html = pageLogin();
        break;
      case "painel":
        html = pagePainel();
        break;
      case "dashboard":
        html = pageDashboard();
        break;
      case "previsao":
        html = pagePrevisao();
        break;
      case "inicio":
      default:
        html = pageInicio();
    }

    app.innerHTML = html;
    setActiveNav(path);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    app.focus({ preventScroll: true });

    window.__sentinelaMap = null;

    if (path === "mapa") {
      setTimeout(initMapa, 100);
    }

    if (path === "denuncias") initDenuncia();
    if (path === "denuncia-enviada") initDenunciaEnviada();
    if (path === "acompanhar") initAcompanhar(params.get("codigo"));
    if (path === "login") initLogin();
    if (path === "painel") initPainel();
    if (path === "dashboard") initDashboard();;
    if (path === "previsao") initPrevisao();
  }

  function initEmergencia() {
    if (document.getElementById("btn-emergencia-flutuante")) {
      return;
    }

    const btnHTML = `
      <button class="btn-emergencia-flutuante" id="btn-emergencia-flutuante" type="button" aria-label="Emergência" title="Números de emergência">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      </button>
    `;

    document.body.insertAdjacentHTML("beforeend", btnHTML);

    const btn = document.getElementById("btn-emergencia-flutuante");
    btn.addEventListener("click", abrirModalEmergencia);
  }

  function abrirModalEmergencia() {
    if (document.getElementById("emergencia-modal")) {
      return;
    }

    const numerosEmergencia = [
      { numero: "190", nome: "Polícia Militar", desc: "Emergências policiais, crimes em andamento" },
      { numero: "192", nome: "SAMU", desc: "Emergências médicas e resgates" },
      { numero: "193", nome: "Bombeiros", desc: "Incêndios, resgates e acidentes" },
      { numero: "191", nome: "Polícia Rodoviária Federal", desc: "Emergências em rodovias federais" },
      { numero: "197", nome: "Polícia Civil", desc: "Denúncias e investigações" },
      { numero: "180", nome: "Central da Mulher", desc: "Violência contra a mulher" },
      { numero: "100", nome: "Disque Direitos Humanos", desc: "Denúncias de violações de direitos" },
      { numero: "198", nome: "PRF - Denúncias", desc: "Denúncias sobre rodovias federais" }
    ];

    const listaHTML = numerosEmergencia.map(n => `
      <a href="tel:${n.numero}" class="emergencia-item">
        <div class="emergencia-item-numero">${n.numero}</div>
        <div class="emergencia-item-info">
          <div class="emergencia-item-nome">${n.nome}</div>
          <div class="emergencia-item-desc">${n.desc}</div>
        </div>
        <svg class="emergencia-item-icone" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </a>
    `).join("");

    const modalHTML = `
      <div class="emergencia-modal" id="emergencia-modal">
        <div class="emergencia-modal-content">
          <div class="emergencia-modal-header">
            <h3 class="emergencia-modal-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Números de Emergência
            </h3>
            <button class="emergencia-modal-close" id="emergencia-modal-close" type="button" aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="emergencia-modal-body">
            <div class="emergencia-aviso">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong>Ligue apenas em casos de emergência.</strong><br>
                Chamadas falsas são crime e podem resultar em multa ou prisão.
              </div>
            </div>
            <div class="emergencia-lista">
              ${listaHTML}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = document.getElementById("emergencia-modal");
    const btnClose = document.getElementById("emergencia-modal-close");

    btnClose.addEventListener("click", fecharModalEmergencia);

    modal.addEventListener("click", (e) => {
      if (e.target.id === "emergencia-modal") {
        fecharModalEmergencia();
      }
    });

    document.addEventListener("keydown", handleEscEmergencia);
  }

  function handleEscEmergencia(e) {
    if (e.key === "Escape") {
      fecharModalEmergencia();
      document.removeEventListener("keydown", handleEscEmergencia);
    }
  }

  function fecharModalEmergencia() {
    const modal = document.getElementById("emergencia-modal");
    if (modal) {
      modal.classList.add("modal-closing");
      setTimeout(() => {
        if (modal.parentNode) modal.remove();
      }, 200);
    }
    document.removeEventListener("keydown", handleEscEmergencia);
  }

  function init() {
    initTheme();
    initMobileNav();
    initEmergencia();
    initAlertasClicaveis();
    window.addEventListener("hashchange", render);
    if (!window.location.hash) window.location.hash = "#/inicio";
    render();
  }

  function initAlertasClicaveis() {
    document.addEventListener("click", (e) => {
      const alerta = e.target.closest(".mini-row--clickable");
      if (alerta) {
        const ocorrenciaId = alerta.dataset.ocorrencia;
        if (ocorrenciaId) {
          window.location.hash = `#/mapa?ocorrencia=${ocorrenciaId}`;
        }
      }
    });
  }

  // function init() {
  //   initTheme();
  //   initMobileNav();
  //   initEmergencia();
  //   window.addEventListener("hashchange", render);
  //   if (!window.location.hash) window.location.hash = "#/inicio";
  //   render();
  // }

  // function init() {
  //   initTheme();
  //   initMobileNav();
  //   window.addEventListener("hashchange", render);
  //   if (!window.location.hash) window.location.hash = "#/inicio";
  //   render();
  // }

  window.addEventListener("dadosCarregados", () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  });

  if (window.SENTINELA_DATA) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})();