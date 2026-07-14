(function () {
  "use strict";

  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  let googleMapsReady = false;
  let googleMapsCarregando = false;
  let googleMapsCarregado = false;

  let chartsInstances = {};
  let mapMarkers = [];
  let heatmapLayer = null;
  let heatmapAtivo = false;
  let estatisticasConfirmacoes = {};
  let tokenUsuario = null;
  const activeFilters = { sev: new Set(["alto", "medio", "baixo"]), tipo: new Set() };
  let chatInvestigadorAtual = { id: null, codigo: null };

  async function carregarGoogleMaps() {
    if (googleMapsCarregado || googleMapsCarregando) return;

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
            <p class="hero__lead">O Sentinela integra o mapeamento de ocorrências em tempo real com um canal de denúncias anônimas protegido.</p>
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
          </div>
        </div>
      </section>
    `;
  }

  function pageMapa() {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) return "<p>Carregando dados...</p>";
    const tiposChips = DATA.tipos.map((t) => `<button class="chip is-active" data-tipo="${t.id}" type="button">${t.nome}</button>`).join("");

    return `
      <section class="page-head">
        <div class="container page-head__row">
          <div>
            <h1 class="page-title">Mapa de ocorrências</h1>
            <p class="page-sub">Visualize ocorrências em tempo real, filtre por tipo e severidade.</p>
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
                  <button class="chip is-active" data-sev="alto" type="button">Alto</button>
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
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
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
    if (!DATA || !DATA.tipos) return "<p>Carregando dados...</p>";
    const tipoOpts = DATA.tipos.map((t) => `<option value="${t.id}">${t.nome}</option>`).join("");
    return `
      <section class="page-head"><div class="container"><span class="eyebrow">${icon("lock", 14)} Canal 100% anônimo</span><h1 class="page-title" style="margin-top:12px">Denúncia anônima</h1><p class="page-sub">Preencha os detalhes abaixo. Não coletamos seu nome, e-mail ou qualquer dado que possa identificar você.</p></div></section>
      <section class="container"><div class="form-grid"><form class="card card--pad-lg" id="form-denuncia" novalidate><div class="field"><label for="tipo">Tipo de ocorrência</label><select class="select" id="tipo" required><option value="" disabled selected>Selecione o tipo</option>${tipoOpts}</select></div><div class="field"><label>Gravidade percebida</label><div class="severity-options"><label class="severity-opt"><input type="radio" name="sev" value="baixo"><strong>Baixo</strong><span>Sem urgência</span></label><label class="severity-opt"><input type="radio" name="sev" value="medio" checked><strong>Médio</strong><span>Requer atenção</span></label><label class="severity-opt"><input type="radio" name="sev" value="alto"><strong>Alto</strong><span>Urgente</span></label></div></div><div class="field-row"><div class="field"><label for="bairro">Bairro / região</label><input class="input" id="bairro" type="text" placeholder="Ex.: Bela Vista" required /></div><div class="field"><label for="quando">Quando ocorreu</label><input class="input" id="quando" type="datetime-local" /></div></div><div class="field"><label for="descricao">Descrição</label><textarea class="textarea" id="descricao" placeholder="Descreva o que aconteceu..." required></textarea><span class="hint">Não inclua nome, telefone ou dados pessoais.</span></div><button class="btn btn--primary btn--lg btn--block" type="submit">${icon("shield", 18)} Enviar denúncia anônima</button></form><aside class="aside-card"><div class="info-box info-box--accent"><h3 class="card__title" style="display:flex;gap:8px;align-items:center">${icon("lock", 18)} Sua proteção vem primeiro</h3><p class="card__desc">Ao enviar, você recebe um <strong>código anônimo</strong>. Use-o para acompanhar o caso e conversar com o investigador.</p></div></aside></div></section>
    `;
  }

  function pageDenunciaEnviada(codigo) {
    return `<section class="container"><div class="chat-layout"><div class="card card--pad-lg code-result"><span class="card__icon" style="margin:0 auto 12px">${icon("check")}</span><p class="code-result__label">Denúncia registrada com sucesso. Guarde seu código anônimo:</p><div class="code-badge">${codigo}</div><p class="card__desc" style="max-width:440px;margin:0 auto 24px">Use este código para acompanhar o andamento e conversar com o investigador.</p><div class="hero__cta" style="justify-content:center;margin:0"><button class="btn btn--soft" id="btn-copiar" type="button">Copiar código</button><a href="#/acompanhar?codigo=${codigo}" class="btn btn--primary" data-nav>Abrir chat seguro ${icon("chat", 16)}</a></div></div></div></section>`;
  }

  function pageAcompanhar(codigo) {
    if (!codigo) {
      return `<section class="page-head"><div class="container"><h1 class="page-title">Acompanhar denúncia</h1><p class="page-sub">Informe o código anônimo recebido para acessar o chat seguro.</p></div></section><section class="container"><div class="chat-layout"><form class="card card--pad-lg" id="form-codigo"><div class="field"><label for="codigo">Código anônimo</label><div class="input-group"><span class="input-prefix">DNC-</span><input class="input input-with-prefix" id="codigo" type="text" placeholder="Ex.: 4821" autocomplete="off" required maxlength="4" pattern="[0-9]*" /></div></div><button class="btn btn--primary btn--lg btn--block" type="submit">${icon("chat", 18)} Acessar chat seguro</button></form></div></section>`;
    }

    return `
      <section class="page-head">
        <div class="container page-head__row">
          <div>
            <h1 class="page-title">Acompanhar denúncia</h1>
            <p class="page-sub">Denúncia <strong>${codigo}</strong> · comunicação criptografada e anônima.</p>
          </div>
          <a href="#/acompanhar" class="btn btn--ghost btn--sm" data-nav>Trocar código</a>
        </div>
      </section>
      <section class="container">
        <div class="chat-layout">
          <div class="chat-tabs">
            <button class="chat-tab is-active" data-tab="conversa">
              ${icon("chat", 16)} Conversa
            </button>
            <button class="chat-tab" data-tab="historico">
              ${icon("clock", 16)} Histórico
            </button>
          </div>
          
          <div class="chat-tab-content" id="tab-conversa">
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
          
          <div class="chat-tab-content" id="tab-historico" style="display: none;">
            <div class="timeline-card">
              <div class="timeline-header">
                <h3>${icon("clock", 20)} Linha do Tempo</h3>
                <p>Todas as ações realizadas nesta denúncia</p>
              </div>
              <div class="timeline-container" id="timeline-publica">
                <p style="text-align: center; color: var(--text-muted); padding: 20px;">Carregando histórico...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function pageLogin() {
    return `<section class="page-head"><div class="container"><h1 class="page-title">Acesso Restrito</h1><p class="page-sub">Painel do Investigador</p></div></section><section class="container"><div class="chat-layout"><form class="card card--pad-lg" id="form-login"><div class="field"><label for="email">E-mail</label><input class="input" id="email" type="email" value="admin@sentinela.com" required /></div><div class="field"><label for="senha">Senha</label><input class="input" id="senha" type="password" value="admin123" required /></div><button class="btn btn--primary btn--lg btn--block" type="submit">Entrar</button></form></div></section>`;
  }

  function pagePainel() {
    return `<section class="page-head"><div class="container page-head__row"><div><h1 class="page-title">Painel do Investigador</h1><p class="page-sub">Gerenciamento de denúncias</p></div><div style="display: flex; gap: 10px;"><button class="btn btn--soft btn--sm" id="btn-export-csv">${icon("chart", 16)} Exportar CSV</button><button class="btn btn--soft btn--sm" id="btn-export-pdf">${icon("chart", 16)} Exportar PDF</button><button class="btn btn--ghost btn--sm" id="btn-logout">Sair</button></div></div></section><section class="container"><div class="card card--pad-lg"><div id="tabela-denuncias">Carregando...</div></div></section>`;
  }

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
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <h3 style="margin-bottom: 8px;">Dados insuficientes</h3>
          <p style="color: var(--text-muted); max-width: 400px; margin: 0 auto;">
            São necessários pelo menos 30 dias de dados com ocorrências registradas para gerar previsões confiáveis.
          </p>
        </div>
      </section>
    `;
  }

  function initDashboard() {
    console.log("Iniciando Dashboard...");

    fetch("/api/dashboard")
      .then(res => {
        console.log("Resposta do dashboard:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("Dados do dashboard recebidos:", data);
        renderCharts(data);
      })
      .catch(err => {
        console.error("Erro no dashboard:", err);
        const container = document.getElementById("tendencias-grid");
        if (container) {
          container.innerHTML = `<p style="color: var(--danger);">Erro ao carregar dashboard: ${err.message}</p>`;
        }
      });

    fetch("/api/tendencias")
      .then(res => res.json())
      .then(data => {
        console.log("Dados de tendências:", data);
        renderTendencias(data);
      })
      .catch(err => console.error("Erro nas tendências:", err));
  }

  function renderCharts(data) {
    Object.values(chartsInstances).forEach(chart => chart.destroy());
    chartsInstances = {};

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDark ? "#eaf1ff" : "#101a2e";
    const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    if (document.getElementById("chart-tipos")) {
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
    }

    if (document.getElementById("chart-severidade")) {
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
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }

    if (document.getElementById("chart-bairros")) {
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
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }

    if (document.getElementById("chart-timeline")) {
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
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }
  }

  function renderTendencias(tendencias) {
    const container = document.getElementById("tendencias-grid");
    if (!container) return;

    if (!Array.isArray(tendencias) || tendencias.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">Dados insuficientes para análise de tendências.</p>`;
      return;
    }

    const html = tendencias.slice(0, 6).map(t => {
      const isAlta = t.status === "alta";
      const isBaixa = t.status === "baixa";
      const iconChar = isAlta ? "↑" : isBaixa ? "↓" : "→";
      const classe = isAlta ? "tendencia-up" : isBaixa ? "tendencia-down" : "tendencia-estavel";
      const textoStatus = isAlta ? "aumento" : isBaixa ? "redução" : "estável";

      return `
        <div class="tendencia-card">
          <div class="tendencia-info">
            <span class="tendencia-nome">${t.tipo}</span>
            <span class="tendencia-count">${t.atual} ocorrências</span>
          </div>
          <div class="tendencia-valor ${classe}">
            <span class="tendencia-icon">${iconChar}</span>
            <span class="tendencia-porcentagem">${t.variacao}%</span>
            <span class="tendencia-legenda">${textoStatus}</span>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = html;
  }

  function initPrevisao() {
    const loading = document.getElementById("previsao-loading");
    const cards = document.getElementById("previsao-cards");
    const vazia = document.getElementById("previsao-vazia");

    if (!loading) {
      console.error("Elemento previsao-loading não encontrado");
      return;
    }

    console.log("Iniciando previsões...");
    const token = localStorage.getItem("sentinela_token");

    if (!token) {
      console.warn("Usuário não autenticado. Redirecionando para login...");
      loading.innerHTML = `<p style="color: var(--text-muted);">Faça login para ver as previsões.</p>`;
      setTimeout(() => {
        window.location.hash = "#/login";
      }, 2000);
      return;
    }

    fetch("/api/painel/previsao", {
      headers: { "Authorization": "Bearer " + token }
    })
      .then(res => {
        console.log("Resposta da previsão:", res.status);
        if (res.status === 401) {
          window.location.hash = "#/login";
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;

        console.log("Dados de previsão recebidos:", data);
        loading.style.display = "none";

        if (!data.previsoes || data.previsoes.length === 0) {
          console.log("Nenhuma previsão disponível");
          if (vazia) vazia.style.display = "block";
          return;
        }

        if (cards) {
          cards.style.display = "grid";
          cards.style.gridTemplateColumns = "repeat(auto-fit, minmax(320px, 1fr))";
          cards.style.gap = "20px";

          const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
          const faixasHorarias = ["00h-06h", "06h-12h", "12h-18h", "18h-24h"];

          const html = data.previsoes.map(p => {
            const isCritico = p.risco === "critico";
            const isElevado = p.risco === "elevado";
            const isModerado = p.risco === "moderado";

            let badgeCor = "var(--success)";
            let badgeTexto = "Zona Tranquila";
            let icone = "✓";
            let classeCard = "";

            if (isCritico) {
              classeCard = " previsao-card--critico";
              badgeCor = "var(--danger)";
              badgeTexto = "Risco Crítico";
              icone = "🔴";
            } else if (isElevado) {
              classeCard = " previsao-card--elevado";
              badgeCor = "var(--accent)";
              badgeTexto = "Risco Elevado";
              icone = "🟠";
            } else if (isModerado) {
              classeCard = " previsao-card--moderado";
              badgeCor = "#f4a63b";
              badgeTexto = "Risco Moderado";
              icone = "🟡";
            }

            const diaNome = diasSemana[p.dia_semana] || "Desconhecido";
            const faixaNome = faixasHorarias[p.faixa_horaria] || "Desconhecida";
            const isHoje = p.dia_semana === data.dia_atual;

            return `
          <div class="previsao-card${classeCard}">
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
        }
      })
      .catch(err => {
        console.error("Erro ao carregar previsões:", err);
        if (loading) {
          loading.innerHTML = `<p style="color: var(--danger);">Erro ao carregar previsões: ${err.message}</p>`;
        }
      });
  }

  function getTokenUsuario() {
    if (tokenUsuario) return tokenUsuario;
    tokenUsuario = localStorage.getItem("sentinela_user_token");
    if (!tokenUsuario) {
      tokenUsuario = "user_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("sentinela_user_token", tokenUsuario);
    }
    return tokenUsuario;
  }

  function filteredOccurrences() {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) return [];
    return DATA.ocorrencias.filter((o) => activeFilters.sev.has(o.severidade) && activeFilters.tipo.has(o.tipo));
  }

  async function renderMarkers(map) {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) return;
    mapMarkers.forEach((m) => m.setMap(null));
    mapMarkers = [];
    const list = filteredOccurrences();
    list.forEach((o) => {
      const cor = DATA.severidades[o.severidade].cor;
      const marker = new google.maps.Marker({
        position: { lat: o.lat, lng: o.lng },
        map: map,
        title: o.titulo,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: o.severidade === "alto" ? 13 : o.severidade === "medio" ? 10 : 8, fillColor: cor, fillOpacity: 0.35, strokeColor: cor, strokeWeight: 2 },
      });
      const infoWindow = new google.maps.InfoWindow({ content: `<div style="font-weight:bold;margin-bottom:4px;">${o.titulo}</div><div style="font-size:0.9rem;color:#666;">${o.bairro} · ${o.tempo}</div><p style="margin:8px 0;font-size:0.95rem;">${o.desc}</p>` });
      marker.addListener("click", () => { infoWindow.open(map, marker); });
      marker._occId = o.id;
      mapMarkers.push(marker);
    });
    if ($("#stat-total")) $("#stat-total").textContent = list.length;
  }

  function initMapa() {
    const DATA = window.SENTINELA_DATA;
    if (!DATA || !googleMapsReady) { setTimeout(initMapa, 500); return; }
    const mapElement = document.getElementById("map");
    if (!mapElement) { setTimeout(initMapa, 500); return; }
    if (window.__sentinelaMap) return;

    const map = new google.maps.Map(mapElement, { center: { lat: DATA.center[0], lng: DATA.center[1] }, zoom: DATA.zoom });
    window.__sentinelaMap = map;
    renderMarkers(map);

    $$("#filtro-severidade .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const s = chip.dataset.sev;
        chip.classList.toggle("is-active");
        chip.classList.contains("is-active") ? activeFilters.sev.add(s) : activeFilters.sev.delete(s);
        renderMarkers(map);
      });
    });
  }

  function initDenuncia() {
    const form = $("#form-denuncia");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        tipo_id: Number($("#tipo").value),
        severidade_id: document.querySelector('input[name="sev"]:checked')?.value || "medio",
        bairro: $("#bairro").value.trim(),
        quando_ocorreu: $("#quando").value || null,
        descricao: $("#descricao").value.trim(),
      };
      try {
        const response = await fetch("/api/denuncias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error);
        window.location.hash = "#/denuncia-enviada?codigo=" + responseData.codigo;
      } catch (error) { showToast("Erro ao enviar denúncia: " + error.message); }
    });
  }

  function initDenunciaEnviada() {
    const btn = $("#btn-copiar");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const code = $(".code-badge").textContent.trim();
      navigator.clipboard?.writeText(code).then(() => showToast("Código copiado."), () => showToast("Copie manualmente: " + code));
    });
  }

  function initAcompanhar(codigo) {
    if (!codigo) {
      const form = $("#form-codigo");
      if (!form) return;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        let c = $("#codigo").value.trim().toUpperCase();
        if (!c.startsWith("DNC-")) c = "DNC-" + c;
        window.location.hash = "#/acompanhar?codigo=" + encodeURIComponent(c.replace(/[^A-Z0-9-]/g, ""));
      });
      return;
    }

    setTimeout(() => {
      const tabs = $$(".chat-tab");
      tabs.forEach(tab => {
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);

        newTab.addEventListener("click", () => {
          tabs.forEach(t => t.classList.remove("is-active"));
          newTab.classList.add("is-active");

          const tabName = newTab.dataset.tab;
          $$(".chat-tab-content").forEach(content => {
            content.style.display = "none";
          });
          document.getElementById(`tab-${tabName}`).style.display = "block";

          if (tabName === "historico") {
            carregarTimelinePublica(codigo);
          }
        });
      });

      initChat(codigo);
    }, 100);
  }

  async function carregarTimelinePublica(codigo) {
    const container = document.getElementById("timeline-publica");
    if (!container) {
      console.error("Container da timeline não encontrado");
      return;
    }

    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Carregando histórico...</p>`;

    try {
      const res = await fetch(`/api/timeline-publica/${encodeURIComponent(codigo)}`);
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);

      const eventos = await res.json();

      if (!eventos || eventos.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum evento registrado ainda.</p>`;
        return;
      }

      container.innerHTML = eventos.map((e, index) => {
        const data = new Date(e.created_at);
        const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dataFormatada = data.toLocaleDateString('pt-BR');
        const isLast = index === eventos.length - 1;

        return `
          <div class="timeline-item ${isLast ? 'timeline-item--last' : ''}">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-evento">${e.evento}</div>
              <div class="timeline-meta">
                <span>🕐 ${hora} · ${dataFormatada}</span>
                <span>👤 ${e.autor || 'Sistema'}</span>
              </div>
            </div>
          </div>
        `;
      }).join("");
    } catch (err) {
      console.error("Erro ao carregar timeline:", err);
      container.innerHTML = `<p style="text-align: center; color: var(--danger); padding: 20px;">Erro ao carregar histórico: ${err.message}</p>`;
    }
  }

  async function initChat(codigo) {
    const body = $("#chat-body");
    const form = $("#chat-form");
    const input = $("#chat-input");
    if (!body || !form || !input) return;
    body.innerHTML = "";
    let denunciaId = null;

    function addBubble({ autor, texto, hora }) {
      const div = document.createElement("div");
      if (autor === "system") {
        div.className = "bubble bubble--system";
        div.textContent = texto;
      } else {
        div.className = "bubble " + (autor === "out" ? "bubble--out" : "bubble--in");
        div.innerHTML = `${texto}<span class="bubble__time">${hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>`;
      }
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    try {
      const response = await fetch(`/api/chat-by-codigo/${encodeURIComponent(codigo)}`);
      if (!response.ok) throw new Error("Denúncia não encontrada");
      const data = await response.json();
      denunciaId = data.denuncia.id;
      if (data.mensagens && data.mensagens.length > 0) {
        data.mensagens.forEach(msg => addBubble({ autor: msg.autor, texto: msg.texto, hora: msg.hora }));
      }
    } catch (error) {
      addBubble({ autor: "system", texto: "Erro ao carregar o chat. Verifique o código." });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val || !denunciaId) return;
      const horaEnvio = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      addBubble({ autor: "out", texto: val, hora: horaEnvio });
      input.value = "";

      try {
        const res = await fetch("/api/chat-mensagem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ denuncia_id: denunciaId, autor: "out", texto: val, hora: horaEnvio })
        });
        const data = await res.json();
        if (data.resposta) {
          setTimeout(() => addBubble({ autor: data.resposta.autor, texto: data.resposta.texto, hora: data.resposta.hora }), 900);
        }
      } catch (error) { showToast("Erro ao enviar mensagem"); }
    });
  }

  function initLogin() {
    const form = $("#form-login");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: $("#email").value, senha: $("#senha").value })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("sentinela_token", data.token);
          window.location.hash = "#/painel";
        } else {
          showToast(data.error);
        }
      } catch (err) { showToast("Erro de conexão"); }
    });
  }

  function initPainel() {
    const token = localStorage.getItem("sentinela_token");
    if (!token) { window.location.hash = "#/login"; return; }

    $("#btn-logout")?.addEventListener("click", () => {
      localStorage.removeItem("sentinela_token");
      window.location.hash = "#/inicio";
    });

    $("#btn-export-csv")?.addEventListener("click", () => window.open("/api/painel/relatorio/csv?token=" + token, "_blank"));
    $("#btn-export-pdf")?.addEventListener("click", () => window.open("/api/painel/relatorio/pdf?token=" + token, "_blank"));

    fetchDenuncias(token);
  }

  async function fetchDenuncias(token) {
    const container = $("#tabela-denuncias");
    if (!container) return;
    container.innerHTML = "Carregando...";

    try {
      const res = await fetch("/api/painel/denuncias", { headers: { "Authorization": "Bearer " + token } });
      if (res.status === 401) {
        localStorage.removeItem("sentinela_token");
        window.location.hash = "#/login";
        return;
      }
      const data = await res.json();
      renderTabelaDenuncias(data, container, token);
    } catch (err) {
      container.innerHTML = "Erro ao carregar dados. Verifique sua conexão.";
    }
  }

  function renderTabelaDenuncias(denuncias, container, token) {
    if (!denuncias || !denuncias.length) {
      container.innerHTML = "<p>Nenhuma denúncia registrada.</p>";
      return;
    }

    let htmlDesktop = `<table class="tabela-denuncias" style="width:100%; border-collapse: collapse;"><thead><tr>
      <th style="text-align:left; padding:12px 8px; border-bottom: 2px solid var(--border);">Código</th>
      <th style="text-align:left; padding:12px 8px; border-bottom: 2px solid var(--border);">Tipo</th>
      <th style="text-align:left; padding:12px 8px; border-bottom: 2px solid var(--border);">Bairro</th>
      <th style="text-align:left; padding:12px 8px; border-bottom: 2px solid var(--border);">Status</th>
      <th style="text-align:left; padding:12px 8px; border-bottom: 2px solid var(--border);">Ações</th>
    </tr></thead><tbody>`;

    let htmlMobile = `<div class="denuncias-cards">`;

    denuncias.forEach(d => {
      const badgeClass = d.status === 'aberta' ? 'baixo' : d.status === 'em_analise' ? 'medio' : 'alto';

      htmlDesktop += `
        <tr class="tabela-row" style="border-bottom: 1px solid var(--border-soft);">
          <td style="padding:12px 8px; font-family: monospace;">${d.codigo_anonimo}</td>
          <td style="padding:12px 8px;">${d.tipo_nome}</td>
          <td style="padding:12px 8px;">${d.bairro}</td>
          <td style="padding:12px 8px;"><span class="mini-badge badge--${badgeClass}">${d.status}</span></td>
          <td style="padding:12px 8px;">
            <select class="select status-select" data-id="${d.id}" style="padding: 6px 10px; font-size: 0.85rem; width: 100%; margin-bottom: 8px;">
              <option value="aberta" ${d.status === 'aberta' ? 'selected' : ''}>Aberta</option>
              <option value="em_analise" ${d.status === 'em_analise' ? 'selected' : ''}>Em Análise</option>
              <option value="resolvida" ${d.status === 'resolvida' ? 'selected' : ''}>Resolvida</option>
              <option value="arquivada" ${d.status === 'arquivada' ? 'selected' : ''}>Arquivada</option>
            </select>
            <div class="btn-group-acoes">
              <button class="btn-acao-painel btn-acao-detalhes" data-id="${d.id}" data-codigo="${d.codigo_anonimo}">Detalhes</button>
              <button class="btn-acao-painel btn-acao-chat" data-id="${d.id}" data-codigo="${d.codigo_anonimo}">Chat</button>
              <button class="btn-acao-painel btn-acao-historico" data-id="${d.id}">Histórico</button>
            </div>
          </td>
        </tr>`;

      htmlMobile += `
        <div class="denuncia-card" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-family: monospace; font-weight: bold;">${d.codigo_anonimo}</span>
            <span class="mini-badge badge--${badgeClass}">${d.status}</span>
          </div>
          <div style="font-size: 0.9rem; margin-bottom: 8px;"><strong>Tipo:</strong> ${d.tipo_nome}</div>
          <div style="font-size: 0.9rem; margin-bottom: 16px;"><strong>Bairro:</strong> ${d.bairro}</div>
          <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; display: block;">Alterar status:</label>
          <select class="select status-select" data-id="${d.id}" style="width: 100%; padding: 10px; font-size: 0.95rem; margin-bottom: 12px;">
            <option value="aberta" ${d.status === 'aberta' ? 'selected' : ''}>Aberta</option>
            <option value="em_analise" ${d.status === 'em_analise' ? 'selected' : ''}>Em Análise</option>
            <option value="resolvida" ${d.status === 'resolvida' ? 'selected' : ''}>Resolvida</option>
            <option value="arquivada" ${d.status === 'arquivada' ? 'selected' : ''}>Arquivada</option>
          </select>
          <div class="btn-group-acoes">
            <button class="btn-acao-painel btn-acao-detalhes" data-id="${d.id}" data-codigo="${d.codigo_anonimo}">Detalhes</button>
            <button class="btn-acao-painel btn-acao-chat" data-id="${d.id}" data-codigo="${d.codigo_anonimo}">Chat</button>
            <button class="btn-acao-painel btn-acao-historico" data-id="${d.id}">Histórico</button>
          </div>
        </div>`;
    });

    htmlDesktop += `</tbody></table>`;
    htmlMobile += `</div>`;
    container.innerHTML = `<div class="tabela-desktop">${htmlDesktop}</div><div class="tabela-mobile">${htmlMobile}</div>`;

    container.querySelectorAll(".status-select").forEach(select => {
      select.addEventListener("change", async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.value;
        select.disabled = true;
        try {
          const res = await fetch(`/api/painel/denuncias/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ status })
          });
          if (res.ok) { showToast("Status atualizado"); fetchDenuncias(token); }
          else { showToast("Erro ao atualizar"); select.disabled = false; }
        } catch (err) { showToast("Erro de conexão"); select.disabled = false; }
      });
    });

    container.querySelectorAll(".btn-acao-detalhes").forEach(btn => {
      btn.addEventListener("click", () => abrirModalDetalhes(btn.dataset.id, token));
    });

    container.querySelectorAll(".btn-acao-chat").forEach(btn => {
      btn.addEventListener("click", () => abrirModalChatInvestigador(btn.dataset.id, btn.dataset.codigo, token));
    });

    container.querySelectorAll(".btn-acao-historico").forEach(btn => {
      btn.addEventListener("click", () => abrirModalTimeline(btn.dataset.id, token));
    });
  }

  async function abrirModalDetalhes(id, token) {
    const modalHTML = `
      <div class="modal-overlay" id="modal-detalhes-overlay" style="display:flex; z-index: 2000;">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title">Detalhes da Denúncia</h3>
            <button class="modal-close" onclick="document.getElementById('modal-detalhes-overlay').remove()">✕</button>
          </div>
          <div id="detalhes-body" style="padding: 20px; text-align: center; color: var(--text-muted);">Carregando detalhes...</div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    try {
      const res = await fetch(`/api/painel/denuncias/${id}`, { headers: { "Authorization": "Bearer " + token } });
      if (!res.ok) throw new Error("Falha ao buscar");
      const data = await res.json();

      document.getElementById("detalhes-body").innerHTML = `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;"><strong style="color: var(--text-muted); font-size: 0.9rem;">Código:</strong><div style="font-family: monospace; color: var(--primary); font-size: 1.1rem;">${data.codigo_anonimo}</div></div>
          <div style="margin-bottom: 16px;"><strong style="color: var(--text-muted); font-size: 0.9rem;">Tipo:</strong><div>${data.tipo_nome}</div></div>
          <div style="margin-bottom: 16px;"><strong style="color: var(--text-muted); font-size: 0.9rem;">Bairro:</strong><div>${data.bairro}</div></div>
          <div style="margin-bottom: 16px;"><strong style="color: var(--text-muted); font-size: 0.9rem;">Status:</strong><div><span class="mini-badge badge--${data.status === 'aberta' ? 'baixo' : data.status === 'em_analise' ? 'medio' : 'alto'}">${data.status}</span></div></div>
          <div style="margin-bottom: 16px;"><strong style="color: var(--text-muted); font-size: 0.9rem;">Quando ocorreu:</strong><div>${data.quando_ocorreu ? new Date(data.quando_ocorreu).toLocaleString('pt-BR') : 'Não informado'}</div></div>
          <div style="margin-top: 24px; padding: 16px; background: var(--bg-soft); border-radius: 8px;">
            <strong style="color: var(--text-muted); font-size: 0.9rem; display: block; margin-bottom: 8px;">Descrição:</strong>
            <div style="color: var(--text); line-height: 1.6;">${data.descricao || 'Sem descrição'}</div>
          </div>
        </div>`;
    } catch (err) {
      document.getElementById("detalhes-body").innerHTML = `<p style="color: var(--danger);">Erro ao carregar detalhes: ${err.message}</p>`;
    }
  }

  async function abrirModalChatInvestigador(denunciaId, codigo, token) {
    chatInvestigadorAtual = { id: Number(denunciaId), codigo: codigo };

    const modalHTML = `
      <div class="modal-overlay" id="modal-chat-inv-overlay" style="display:flex; z-index: 2000;">
        <div class="modal-content" style="max-width: 600px; height: 500px; display: flex; flex-direction: column;">
          <div class="modal-header">
            <h3 class="modal-title">Chat com Denunciante <span style="font-size:0.8rem; color:var(--primary); margin-left:8px;">${codigo}</span></h3>
            <button class="modal-close" id="modal-chat-close-btn" type="button" aria-label="Fechar">✕</button>
          </div>
          <div class="chat-investigador-container" style="flex: 1; display: flex; flex-direction: column;">
            <div class="chat-investigador-messages" id="chat-inv-messages">
              <p style="text-align: center; color: var(--text-muted); margin-top: 20px;">Carregando mensagens...</p>
            </div>
            <div class="chat-investigador-input" style="display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--border);">
              <input type="text" id="chat-inv-input" placeholder="Escreva sua resposta..." style="flex: 1; padding: 10px 16px; border: 1px solid var(--border); border-radius: 20px; font-size: 0.9rem; outline: none;">
              <button id="modal-chat-send-btn" style="padding: 10px 20px; background: var(--primary); color: #fff; border: none; border-radius: 20px; cursor: pointer; font-weight: 600;">Enviar</button>
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    setTimeout(() => {
      const closeBtn = document.getElementById("modal-chat-close-btn");
      const sendBtn = document.getElementById("modal-chat-send-btn");
      const input = document.getElementById("chat-inv-input");

      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          const modal = document.getElementById("modal-chat-inv-overlay");
          if (modal) modal.remove();
        });
      }

      if (sendBtn) {
        sendBtn.addEventListener("click", () => {
          window.enviarMensagemChatInvestigador();
        });
      }

      if (input) {
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            window.enviarMensagemChatInvestigador();
          }
        });
        input.focus();
      }
    }, 100);

    await carregarMensagensChatInvestigador();
  }

  window.enviarMensagemChatInvestigador = async function () {
    const input = document.getElementById("chat-inv-input");
    if (!input) return;

    const texto = input.value.trim();
    if (!texto || !chatInvestigadorAtual.id) return;

    const agora = new Date();
    const hora = String(agora.getHours()).padStart(2, "0") + ":" + String(agora.getMinutes()).padStart(2, "0");

    const messagesDiv = document.getElementById("chat-inv-messages");
    if (!messagesDiv) return;

    const div = document.createElement("div");
    div.className = "chat-msg-inv investigador";
    div.style.cssText = "align-self: flex-end; background: var(--primary); color: #fff; padding: 10px 14px; border-radius: 12px; max-width: 80%; margin-bottom: 12px; border-bottom-right-radius: 4px;";
    div.innerHTML = `${texto}<span style="font-size: 0.7rem; opacity: 0.7; margin-top: 4px; display: block; text-align: right;">${hora}</span>`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    input.value = "";

    try {
      const response = await fetch("/api/chat-mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          denuncia_id: Number(chatInvestigadorAtual.id),
          autor: "in",
          texto: texto,
          hora: hora
        })
      });

      if (!response.ok) throw new Error("Falha no servidor");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      showToast("Erro ao enviar mensagem. Tente novamente.");
      if (div.parentNode) div.parentNode.removeChild(div);
    }
  };

  async function carregarMensagensChatInvestigador() {
    const messagesDiv = document.getElementById("chat-inv-messages");
    if (!messagesDiv) return;

    try {
      const res = await fetch(`/api/chat-by-codigo/${encodeURIComponent(chatInvestigadorAtual.codigo)}`);
      const data = await res.json();
      messagesDiv.innerHTML = "";

      if (data.mensagens && data.mensagens.length > 0) {
        data.mensagens.forEach(msg => {
          const div = document.createElement("div");
          if (msg.autor === "system") {
            div.className = "chat-msg-inv system";
            div.textContent = msg.texto;
          } else {
            div.className = `chat-msg-inv ${msg.autor === 'in' ? 'investigador' : 'denunciante'}`;
            div.innerHTML = `${msg.texto}<span class="hora-msg">${msg.hora || ''}</span>`;
          }
          messagesDiv.appendChild(div);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      } else {
        messagesDiv.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Nenhuma mensagem ainda. Seja o primeiro a responder.</p>`;
      }
    } catch (err) {
      messagesDiv.innerHTML = `<p style="text-align: center; color: var(--danger);">Erro ao carregar chat.</p>`;
    }
  }

  async function abrirModalTimeline(denunciaId, token) {
    const modalHTML = `
      <div class="modal-overlay" id="modal-timeline-overlay" style="display:flex; z-index: 2000;">
        <div class="modal-content modal-timeline" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title">${icon("clock", 20)} Linha do Tempo</h3>
            <button class="modal-close" id="modal-timeline-close" type="button" aria-label="Fechar">✕</button>
          </div>
          <div class="modal-body" id="timeline-body" style="padding: 20px; max-height: 400px; overflow-y: auto;">
            <p style="text-align: center; color: var(--text-muted);">Carregando histórico...</p>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    document.getElementById("modal-timeline-close").addEventListener("click", () => document.getElementById("modal-timeline-overlay").remove());

    try {
      const res = await fetch(`/api/timeline/${denunciaId}`, { headers: { "Authorization": "Bearer " + token } });
      if (!res.ok) throw new Error("Erro ao buscar");
      const eventos = await res.json();

      const body = document.getElementById("timeline-body");
      if (!eventos || eventos.length === 0) {
        body.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Nenhum evento registrado ainda.</p>`;
        return;
      }

      body.innerHTML = eventos.map((e, index) => {
        const data = new Date(e.created_at);
        const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dataFormatada = data.toLocaleDateString('pt-BR');
        return `
          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <div style="display: flex; flex-direction: column; align-items: center; width: 16px;">
              <div style="width: 16px; height: 16px; border-radius: 50%; background: ${index === eventos.length - 1 ? '#43c98a' : '#17b8a6'}; border: 3px solid var(--bg-soft);"></div>
              ${index !== eventos.length - 1 ? '<div style="width: 2px; flex: 1; background: var(--border); margin-top: 4px;"></div>' : ''}
            </div>
            <div style="flex: 1; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 14px;">
              <div style="color: var(--text); font-weight: 600; font-size: 15px; margin-bottom: 8px;">${e.evento}</div>
              <div style="display: flex; gap: 16px; color: var(--text-muted); font-size: 12px;">
                <span>🕐 ${hora} · ${dataFormatada}</span>
                <span>👤 ${e.autor || 'Sistema'}</span>
              </div>
            </div>
          </div>`;
      }).join("");
    } catch (err) {
      document.getElementById("timeline-body").innerHTML = `<p style="color: var(--danger); text-align: center;">Erro ao carregar timeline: ${err.message}</p>`;
    }
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
      const match = route === path || (route === "denuncias" && path === "denuncia-enviada") || (route === "acompanhar" && path === "acompanhar");
      l.classList.toggle("is-active", match);
    });
  }

  function render() {
    const { path, params } = parseHash();
    let html = "";

    switch (path) {
      case "mapa": html = pageMapa(); break;
      case "denuncias": html = pageDenuncias(); break;
      case "denuncia-enviada": html = pageDenunciaEnviada(params.get("codigo") || "DNC-0000"); break;
      case "acompanhar": html = pageAcompanhar(params.get("codigo")); break;
      case "login": html = pageLogin(); break;
      case "painel": html = pagePainel(); break;
      case "dashboard": html = pageDashboard(); break;
      case "previsao": html = pagePrevisao(); break;
      case "inicio": default: html = pageInicio();
    }

    app.innerHTML = html;
    setActiveNav(path);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    window.__sentinelaMap = null;

    // Aguarda o próximo tick do event loop para garantir que o DOM foi renderizado
    requestAnimationFrame(() => {
      if (path === "mapa") {
        initMapa();
      }

      if (path === "denuncias") initDenuncia();
      if (path === "denuncia-enviada") initDenunciaEnviada();
      if (path === "acompanhar") initAcompanhar(params.get("codigo"));
      if (path === "login") initLogin();
      if (path === "painel") initPainel();

      if (path === "dashboard") {
        // Aguarda um pouco mais para garantir que o Chart.js está pronto
        setTimeout(() => {
          initDashboard();
        }, 300);
      }

      if (path === "previsao") {
        setTimeout(() => {
          initPrevisao();
        }, 300);
      }
    });
  }

  function initEmergencia() {
    if (document.getElementById("btn-emergencia-flutuante")) return;
    const btnHTML = `<button class="btn-emergencia-flutuante" id="btn-emergencia-flutuante" type="button" aria-label="Emergência" title="Números de emergência" style="position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#ef5a63;color:#fff;border:none;box-shadow:0 4px 12px rgba(239,90,99,0.4);cursor:pointer;z-index:999;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>`;
    document.body.insertAdjacentHTML("beforeend", btnHTML);
  }

  function init() {
    initTheme();
    initMobileNav();
    initEmergencia();
    window.addEventListener("hashchange", render);
    if (!window.location.hash) window.location.hash = "#/inicio";
    render();
  }

  window.addEventListener("dadosCarregados", () => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  });

  if (window.SENTINELA_DATA) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();