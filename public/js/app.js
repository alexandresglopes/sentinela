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

  const translations = {
    pt: {
      titulo_nav_inicio: "Início",
      titulo_nav_mapa: "Mapa",
      titulo_nav_dashboard: "Dashboard",
      titulo_nav_previsoes: "Previsões",
      titulo_nav_denuncias: "Denúncias",
      titulo_nav_acompanhar: "Acompanhar",
      titulo_btn_denuncia: "Fazer Denúncia",
      nav_mapa: "Ver mapa de ocorrências",
      nav_denuncia: "Fazer denúncia anônima",
      hero_subtitle: "Segurança pública colaborativa",
      hero_title: "Cidades mais seguras com dados e participação cidadã",
      hero_lead: "O Sentinela integra o mapeamento de ocorrências em tempo real com um canal de denúncias anônimas protegido.",
      stat_ocorrencias: "Ocorrências mapeadas hoje",
      stat_risco: "Zonas de risco alto",
      stat_anonimo: "Denúncias anônimas",
      alertas_tempo_real: "Alertas em tempo real",
      btn_registrar: "Registrar ocorrência",
      titulo_mapa: "Mapa de ocorrências",
      sub_mapa: "Visualize ocorrências em tempo real, filtre por tipo e severidade.",
      filtro_severidade: "Severidade",
      filtro_tipo: "Tipo de ocorrência",
      ocorrencias_recentes: "Ocorrências recentes",
      btn_heatmap: "Mapa de calor",
      btn_minha_localizacao: "Minha localização",
      placeholder_bairro: "Ex.: Bela Vista",
      placeholder_descricao: "Descreva o que aconteceu...",
      placeholder_codigo: "Ex.: 4821",
      hint_dados_pessoais: "Não inclua nome, telefone ou dados pessoais.",
      btn_enviar_denuncia: "Enviar denúncia anônima",
      protecao_vem_primeiro: "Sua proteção vem primeiro",
      texto_protecao: "Ao enviar, você recebe um código anônimo. Use-o para acompanhar o caso e conversar com o investigador.",
      btn_copiar: "Copiar código",
      btn_abrir_chat: "Abrir chat seguro",
      titulo_acompanhar: "Acompanhar denúncia",
      sub_acompanhar: "Informe o código anônimo recebido para acessar o chat seguro.",
      label_codigo: "Código anônimo",
      btn_acessar_chat: "Acessar chat seguro",
      trocar_codigo: "Trocar código",
      comunicacao_criptografada: "comunicação criptografada e anônima.",
      conversas: "Conversa",
      historico: "Histórico",
      investigador_responsavel: "Investigador responsável",
      online: "Online",
      criptografado: "Criptografado",
      placeholder_mensagem: "Escreva sua mensagem…",
      btn_enviar: "Enviar",
      linha_do_tempo: "Linha do Tempo",
      todas_acoes: "Todas as ações realizadas nesta denúncia",
      carregando_historico: "Carregando histórico...",
      acesso_restrito: "Acesso Restrito",
      painel_investigador: "Painel do Investigador",
      email: "E-mail",
      senha: "Senha",
      btn_entrar: "Entrar",
      btn_sair: "Sair",
      btn_exportar_csv: "Exportar CSV",
      btn_exportar_pdf: "Exportar PDF",
      gerenciando_denuncias: "Gerenciamento de denúncias",
      carregando: "Carregando...",
      coluna_codigo: "Código",
      coluna_tipo: "Tipo",
      coluna_bairro: "Bairro",
      coluna_status: "Status",
      coluna_acoes: "Ações",
      acao_detalhes: "Detalhes",
      acao_chat: "Chat",
      acao_historico: "Histórico",
      label_alterar_status: "Alterar status:",
      status_aberta: "Aberta",
      status_em_analise: "Em Análise",
      status_resolvida: "Resolvida",
      status_arquivada: "Arquivada",
      modal_detalhes_titulo: "Detalhes da Denúncia",
      modal_detalhes_codigo: "Código:",
      modal_detalhes_tipo: "Tipo:",
      modal_detalhes_bairro: "Bairro:",
      modal_detalhes_status: "Status:",
      modal_detalhes_quando: "Quando ocorreu:",
      modal_detalhes_registrado: "Registrado em:",
      modal_detalhes_descricao: "Descrição:",
      sem_descricao: "Sem descrição",
      nao_informado: "Não informado",
      btn_cancelar: "Cancelar",
      btn_confirmar_registro: "Registrar ocorrência",
      modal_registro_titulo: "Registrar nova ocorrência",
      label_tipo_ocorrencia: "Tipo de ocorrência *",
      selecione_tipo: "Selecione o tipo",
      label_severidade: "Severidade *",
      sev_baixo: "Baixo",
      sev_medio: "Médio",
      sev_alto: "Alto",
      sem_urgencia: "Sem urgência",
      requer_atencao: "Requer atenção",
      urgente: "Urgente",
      label_bairro: "Bairro / região *",
      label_descricao_modal: "Descrição *",
      local_selecionado: "Local:",
      confirmar: "Confirmar",
      falsa: "Falsa",
      confirmaram: "confirmaram",
      reportaram: "reportaram",
      sucesso_registro: "Ocorrência registrada com sucesso!",
      guarde_codigo: "Guarde seu código anônimo:",
      use_codigo: "Use este código para acompanhar o andamento e conversar com o investigador.",
      clique_mapa: "Clique no mapa para selecionar o local da ocorrência",
      localizacao_centralizada: "Mapa centralizado na sua localização!",
      localizacao_negada: "Localização negada. Clique no botão novamente e permita o acesso.",
      localizacao_indisponivel: "Localização indisponível. Verifique suas configurações.",
      tempo_esgotado: "Tempo esgotado. Tente novamente.",
      geo_nao_suportada: "Geolocalização não suportada. Usando localização padrão.",
      erro_conexao: "Erro de conexão"
    },
    en: {
      titulo_nav_inicio: "Start",
      titulo_nav_mapa: "Map",
      titulo_nav_dashboard: "Dashboard",
      titulo_nav_previsoes: "Forecasts",
      titulo_nav_denuncias: "Reports",
      titulo_nav_acompanhar: "To accompany",
      titulo_btn_denuncia: "File a Report",
      nav_mapa: "View incident map",
      nav_denuncia: "Make an anonymous report",
      hero_subtitle: "Collaborative public safety",
      hero_title: "Safer cities with data and citizen participation",
      hero_lead: "Sentinela integrates real-time incident mapping with a protected anonymous reporting channel.",
      stat_ocorrencias: "Incidents mapped today",
      stat_risco: "High-risk zones",
      stat_anonimo: "Anonymous reports",
      alertas_tempo_real: "Real-time alerts",
      btn_registrar: "Register incident",
      titulo_mapa: "Incident Map",
      sub_mapa: "View real-time incidents, filter by type and severity.",
      filtro_severidade: "Severity",
      filtro_tipo: "Incident type",
      ocorrencias_recentes: "Recent incidents",
      btn_heatmap: "Heatmap",
      btn_minha_localizacao: "My location",
      placeholder_bairro: "Ex.: Downtown",
      placeholder_descricao: "Describe what happened...",
      placeholder_codigo: "Ex.: 4821",
      hint_dados_pessoais: "Do not include name, phone, or personal data.",
      btn_enviar_denuncia: "Send anonymous report",
      protecao_vem_primeiro: "Your protection comes first",
      texto_protecao: "Upon sending, you receive an anonymous code. Use it to track the case and chat with the investigator.",
      btn_copiar: "Copy code",
      btn_abrir_chat: "Open secure chat",
      titulo_acompanhar: "Track report",
      sub_acompanhar: "Enter the anonymous code received to access the secure chat.",
      label_codigo: "Anonymous code",
      btn_acessar_chat: "Access secure chat",
      trocar_codigo: "Change code",
      comunicacao_criptografada: "encrypted and anonymous communication.",
      conversas: "Chat",
      historico: "History",
      investigador_responsavel: "Lead investigator",
      online: "Online",
      criptografado: "Encrypted",
      placeholder_mensagem: "Type your message…",
      btn_enviar: "Send",
      linha_do_tempo: "Timeline",
      todas_acoes: "All actions taken on this report",
      carregando_historico: "Loading history...",
      acesso_restrito: "Restricted Access",
      painel_investigador: "Investigator Dashboard",
      email: "Email",
      senha: "Password",
      btn_entrar: "Login",
      btn_sair: "Logout",
      btn_exportar_csv: "Export CSV",
      btn_exportar_pdf: "Export PDF",
      gerenciando_denuncias: "Report Management",
      carregando: "Loading...",
      coluna_codigo: "Code",
      coluna_tipo: "Type",
      coluna_bairro: "Neighborhood",
      coluna_status: "Status",
      coluna_acoes: "Actions",
      acao_detalhes: "Details",
      acao_chat: "Chat",
      acao_historico: "History",
      label_alterar_status: "Change status:",
      status_aberta: "Open",
      status_em_analise: "In Analysis",
      status_resolvida: "Resolved",
      status_arquivada: "Archived",
      modal_detalhes_titulo: "Report Details",
      modal_detalhes_codigo: "Code:",
      modal_detalhes_tipo: "Type:",
      modal_detalhes_bairro: "Neighborhood:",
      modal_detalhes_status: "Status:",
      modal_detalhes_quando: "When it occurred:",
      modal_detalhes_registrado: "Registered on:",
      modal_detalhes_descricao: "Description:",
      sem_descricao: "No description",
      nao_informado: "Not informed",
      btn_cancelar: "Cancel",
      btn_confirmar_registro: "Register incident",
      modal_registro_titulo: "Register new incident",
      label_tipo_ocorrencia: "Incident type *",
      selecione_tipo: "Select type",
      label_severidade: "Severity *",
      sev_baixo: "Low",
      sev_medio: "Medium",
      sev_alto: "High",
      sem_urgencia: "No urgency",
      requer_atencao: "Requires attention",
      urgente: "Urgent",
      label_bairro: "Neighborhood / region *",
      label_descricao_modal: "Description *",
      local_selecionado: "Location:",
      confirmar: "Confirm",
      falsa: "False",
      confirmaram: "confirmed",
      reportaram: "reported",
      sucesso_registro: "Incident registered successfully!",
      guarde_codigo: "Keep your anonymous code:",
      use_codigo: "Use this code to track the progress and chat with the investigator.",
      clique_mapa: "Click on the map to select the location",
      localizacao_centralizada: "Map centered on your location!",
      localizacao_negada: "Location denied. Click the button again and allow access.",
      localizacao_indisponivel: "Location unavailable. Check your settings.",
      tempo_esgotado: "Time out. Try again.",
      geo_nao_suportada: "Geolocation not supported. Using default location.",
      erro_conexao: "Connection error"
    },
    es: {
      titulo_nav_inicio: "Comenzar",
      titulo_nav_mapa: "Mapa",
      titulo_nav_dashboard: "Panel",
      titulo_nav_previsoes: "Pronósticos",
      titulo_nav_denuncias: "Informes",
      titulo_nav_acompanhar: "Para acompañar",
      titulo_btn_denuncia: "Presentar un informe",
      nav_mapa: "Ver mapa de incidentes",
      nav_denuncia: "Hacer denuncia anónima",
      hero_subtitle: "Seguridad pública colaborativa",
      hero_title: "Ciudades más seguras con datos y participación ciudadana",
      hero_lead: "Sentinela integra el mapeo de incidentes en tiempo real con un canal de denuncias anónimas protegido.",
      stat_ocorrencias: "Incidentes mapeados hoy",
      stat_risco: "Zonas de alto riesgo",
      stat_anonimo: "Denuncias anónimas",
      alertas_tempo_real: "Alertas en tiempo real",
      btn_registrar: "Registrar incidente",
      titulo_mapa: "Mapa de incidentes",
      sub_mapa: "Visualice incidentes en tiempo real, filtre por tipo y severidad.",
      filtro_severidade: "Severidad",
      filtro_tipo: "Tipo de incidente",
      ocorrencias_recentes: "Incidentes recientes",
      btn_heatmap: "Mapa de calor",
      btn_minha_localizacao: "Mi ubicación",
      placeholder_bairro: "Ej.: Centro",
      placeholder_descricao: "Describa lo que sucedió...",
      placeholder_codigo: "Ej.: 4821",
      hint_dados_pessoais: "No incluya nombre, teléfono o datos personales.",
      btn_enviar_denuncia: "Enviar denuncia anónima",
      protecao_vem_primeiro: "Su protección es lo primero",
      texto_protecao: "Al enviar, recibe un código anónimo. Úselo para seguir el caso y chatear con el investigador.",
      btn_copiar: "Copiar código",
      btn_abrir_chat: "Abrir chat seguro",
      titulo_acompanhar: "Seguimiento de denuncia",
      sub_acompanhar: "Ingrese el código anónimo recibido para acceder al chat seguro.",
      label_codigo: "Código anónimo",
      btn_acessar_chat: "Acceder al chat seguro",
      trocar_codigo: "Cambiar código",
      comunicacao_criptografada: "comunicación cifrada y anónima.",
      conversas: "Chat",
      historico: "Historial",
      investigador_responsavel: "Investigador responsable",
      online: "En línea",
      criptografado: "Cifrado",
      placeholder_mensagem: "Escribe tu mensaje…",
      btn_enviar: "Enviar",
      linha_do_tempo: "Línea de Tiempo",
      todas_acoes: "Todas las acciones realizadas en esta denuncia",
      carregando_historico: "Cargando historial...",
      acesso_restrito: "Acceso Restringido",
      painel_investigador: "Panel del Investigador",
      email: "Correo electrónico",
      senha: "Contraseña",
      btn_entrar: "Entrar",
      btn_sair: "Salir",
      btn_exportar_csv: "Exportar CSV",
      btn_exportar_pdf: "Exportar PDF",
      gerenciando_denuncias: "Gestión de denuncias",
      carregando: "Cargando...",
      coluna_codigo: "Código",
      coluna_tipo: "Tipo",
      coluna_bairro: "Barrio",
      coluna_status: "Estado",
      coluna_acoes: "Acciones",
      acao_detalhes: "Detalles",
      acao_chat: "Chat",
      acao_historico: "Historial",
      label_alterar_status: "Cambiar estado:",
      status_aberta: "Abierta",
      status_em_analise: "En análisis",
      status_resolvida: "Resuelta",
      status_arquivada: "Archivada",
      modal_detalhes_titulo: "Detalles de la Denuncia",
      modal_detalhes_codigo: "Código:",
      modal_detalhes_tipo: "Tipo:",
      modal_detalhes_bairro: "Barrio:",
      modal_detalhes_status: "Estado:",
      modal_detalhes_quando: "Cuándo ocurrió:",
      modal_detalhes_registrado: "Registrado el:",
      modal_detalhes_descricao: "Descripción:",
      sem_descricao: "Sin descripción",
      nao_informado: "No informado",
      btn_cancelar: "Cancelar",
      btn_confirmar_registro: "Registrar incidente",
      modal_registro_titulo: "Registrar nuevo incidente",
      label_tipo_ocorrencia: "Tipo de incidente *",
      selecione_tipo: "Seleccione el tipo",
      label_severidade: "Severidad *",
      sev_baixo: "Baja",
      sev_medio: "Media",
      sev_alto: "Alta",
      sem_urgencia: "Sin urgencia",
      requer_atencao: "Requiere atención",
      urgente: "Urgente",
      label_bairro: "Barrio / región *",
      label_descricao_modal: "Descripción *",
      local_selecionado: "Ubicación:",
      confirmar: "Confirmar",
      falsa: "Falsa",
      confirmaram: "confirmaron",
      reportaram: "reportaron",
      sucesso_registro: "¡Incidente registrado con éxito!",
      guarde_codigo: "Guarde su código anónimo:",
      use_codigo: "Use este código para seguir el progreso y chatear con el investigador.",
      clique_mapa: "Haga clic en el mapa para seleccionar la ubicación",
      localizacao_centralizada: "¡Mapa centrado en su ubicación!",
      localizacao_negada: "Ubicación denegada. Haga clic nuevamente y permita el acceso.",
      localizacao_indisponivel: "Ubicación no disponible. Verifique su configuración.",
      tempo_esgotado: "Tiempo agotado. Inténtalo de nuevo.",
      geo_nao_suportada: "Geolocalización no soportada. Usando ubicación predeterminada.",
      erro_conexao: "Error de conexión"
    },
    fr: {
      titulo_nav_inicio: "Commencer",
      titulo_nav_mapa: "Carte",
      titulo_nav_dashboard: "Tableau de bord",
      titulo_nav_previsoes: "Prévisions",
      titulo_nav_denuncias: "Rapports",
      titulo_nav_acompanhar: "Pour accompagner",
      titulo_btn_denuncia: "Déposer un signalement",
      nav_mapa: "Voir la carte des incidents",
      nav_denuncia: "Faire un signalement anonyme",
      hero_subtitle: "Sécurité publique collaborative",
      hero_title: "Des villes plus sûres avec des données et la participation citoyenne",
      hero_lead: "Sentinela intègre la cartographie des incidents en temps réel avec un canal de signalement anonyme protégé.",
      stat_ocorrencias: "Incidents cartographiés aujourd'hui",
      stat_risco: "Zones à haut risque",
      stat_anonimo: "Signalements anonymes",
      alertas_tempo_real: "Alertes en temps réel",
      btn_registrar: "Enregistrer un incident",
      titulo_mapa: "Carte des incidents",
      sub_mapa: "Visualisez les incidents en temps réel, filtrez par type et gravité.",
      filtro_severidade: "Gravité",
      filtro_tipo: "Type d'incident",
      ocorrencias_recentes: "Incidents récents",
      btn_heatmap: "Carte de chaleur",
      btn_minha_localizacao: "Ma position",
      placeholder_bairro: "Ex. : Centre-ville",
      placeholder_descricao: "Décrivez ce qui s'est passé...",
      placeholder_codigo: "Ex. : 4821",
      hint_dados_pessoais: "N'incluez pas de nom, téléphone ou données personnelles.",
      btn_enviar_denuncia: "Envoyer un signalement anonyme",
      protecao_vem_primeiro: "Votre protection passe avant tout",
      texto_protecao: "Lors de l'envoi, vous recevez un code anonyme. Utilisez-le pour suivre le dossier et discuter avec l'enquêteur.",
      btn_copiar: "Copier le code",
      btn_abrir_chat: "Ouvrir le chat sécurisé",
      titulo_acompanhar: "Suivre le signalement",
      sub_acompanhar: "Entrez le code anonyme reçu pour accéder au chat sécurisé.",
      label_codigo: "Code anonyme",
      btn_acessar_chat: "Accéder au chat sécurisé",
      trocar_codigo: "Changer de code",
      comunicacao_criptografada: "communication chiffrée et anonyme.",
      conversas: "Discussion",
      historico: "Historique",
      investigador_responsavel: "Enquêteur responsable",
      online: "En ligne",
      criptografado: "Chiffré",
      placeholder_mensagem: "Écrivez votre message…",
      btn_enviar: "Envoyer",
      linha_do_tempo: "Chronologie",
      todas_acoes: "Toutes les actions réalisées sur ce signalement",
      carregando_historico: "Chargement de l'historique...",
      acesso_restrito: "Accès Restreint",
      painel_investigador: "Tableau de bord de l'enquêteur",
      email: "E-mail",
      senha: "Mot de passe",
      btn_entrar: "Se connecter",
      btn_sair: "Se déconnecter",
      btn_exportar_csv: "Exporter CSV",
      btn_exportar_pdf: "Exporter PDF",
      gerenciando_denuncias: "Gestion des signalements",
      carregando: "Chargement...",
      coluna_codigo: "Code",
      coluna_tipo: "Type",
      coluna_bairro: "Quartier",
      coluna_status: "Statut",
      coluna_acoes: "Actions",
      acao_detalhes: "Détails",
      acao_chat: "Chat",
      acao_historico: "Historique",
      label_alterar_status: "Changer le statut :",
      status_aberta: "Ouverte",
      status_em_analise: "En analyse",
      status_resolvida: "Résolue",
      status_arquivada: "Archivée",
      modal_detalhes_titulo: "Détails du signalement",
      modal_detalhes_codigo: "Code :",
      modal_detalhes_tipo: "Type :",
      modal_detalhes_bairro: "Quartier :",
      modal_detalhes_status: "Statut :",
      modal_detalhes_quando: "Quand cela s'est-il produit :",
      modal_detalhes_registrado: "Enregistré le :",
      modal_detalhes_descricao: "Description :",
      sem_descricao: "Pas de description",
      nao_informado: "Non informé",
      btn_cancelar: "Annuler",
      btn_confirmar_registro: "Enregistrer l'incident",
      modal_registro_titulo: "Enregistrer un nouvel incident",
      label_tipo_ocorrencia: "Type d'incident *",
      selecione_tipo: "Sélectionnez le type",
      label_severidade: "Gravité *",
      sev_baixo: "Faible",
      sev_medio: "Moyenne",
      sev_alto: "Élevée",
      sem_urgencia: "Sans urgence",
      requer_atencao: "Nécessite une attention",
      urgente: "Urgent",
      label_bairro: "Quartier / région *",
      label_descricao_modal: "Description *",
      local_selecionado: "Emplacement :",
      confirmar: "Confirmer",
      falsa: "Faux",
      confirmaram: "ont confirmé",
      reportaram: "ont signalé",
      sucesso_registro: "Incident enregistré avec succès !",
      guarde_codigo: "Gardez votre code anonyme :",
      use_codigo: "Utilisez ce code pour suivre les progrès et discuter avec l'enquêteur.",
      clique_mapa: "Cliquez sur la carte pour sélectionner l'emplacement",
      localizacao_centralizada: "Carte centrée sur votre position !",
      localizacao_negada: "Localisation refusée. Cliquez à nouveau et autorisez l'accès.",
      localizacao_indisponivel: "Localisation indisponible. Vérifiez vos paramètres.",
      tempo_esgotado: "Délai dépassé. Réessayez.",
      geo_nao_suportada: "Géolocalisation non prise en charge. Utilisation de l'emplacement par défaut.",
      erro_conexao: "Erreur de connexion"
    }
  };

  function setLanguage(lang) {
    localStorage.setItem('sentinela-lang', lang);
    const t = translations[lang] || translations['pt'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key]) el.placeholder = t[key];
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (t[key]) el.title = t[key];
    });

    document.documentElement.lang = lang;
  }

  function t(key) {
    const lang = localStorage.getItem('sentinela-lang') || 'pt';
    return translations[lang][key] || translations['pt'][key] || key;
  }

  async function carregarGoogleMaps() {
    if (googleMapsCarregado) return;
    if (document.getElementById("google-maps-script")) {
      console.log("⏳ Script do Google Maps já existe, aguardando inicialização...");
      googleMapsCarregando = true;
      let attempts = 0;
      const checkReady = setInterval(() => {
        attempts++;
        if (window.google && window.google.maps && window.google.maps.Map) {
          clearInterval(checkReady);
          googleMapsReady = true;
          googleMapsCarregado = true;
          googleMapsCarregando = false;
          console.log("✅ Google Maps pronto (do cache)");
          if (parseHash().path === "mapa") setTimeout(initMapa, 100);
        } else if (attempts > 20) {
          clearInterval(checkReady);
          console.error("❌ Timeout aguardando Google Maps");
        }
      }, 200);
      return;
    }

    googleMapsCarregando = true;
    try {
      const response = await fetch("/api/config");
      const config = await response.json();
      if (!config.googleMapsApiKey) {
        console.error("❌ API Key não configurada");
        googleMapsCarregando = false;
        return;
      }

      window.initGoogleMaps = function () {
        googleMapsReady = true;
        googleMapsCarregado = true;
        googleMapsCarregando = false;
        console.log("✅ Google Maps carregado com sucesso");
        if (parseHash().path === "mapa") setTimeout(initMapa, 100);
      };

      window.gm_authFailure = function () {
        console.error("❌ Falha na autenticação do Google Maps - API Key inválida");
        googleMapsCarregando = false;
        showToast(t("erro_conexao"));
      };

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&libraries=visualization&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-script";
      script.onerror = () => {
        console.error("❌ Erro ao carregar script do Google Maps");
        googleMapsCarregando = false;
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error("❌ Erro ao carregar Google Maps:", error);
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
      phone: `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`,
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
    if (!DATA) return "<p>" + t("carregando") + "</p>";
    const totalHoje = DATA.ocorrencias.length;
    const altos = DATA.ocorrencias.filter((o) => o.severidade === "alto").length;

    return `
      <section class="hero">
        <div class="container hero__grid">
          <div>
            <span class="eyebrow">${icon("shield", 14)} <span data-i18n="hero_subtitle">Segurança pública colaborativa</span></span>
            <h1 class="hero__title" data-i18n="hero_title">Cidades mais seguras com <span>dados</span> e <span>participação cidadã</span></h1>
            <p class="hero__lead" data-i18n="hero_lead">O Sentinela integra o mapeamento de ocorrências em tempo real com um canal de denúncias anônimas protegido.</p>
            <div class="hero__cta">
              <a href="#/mapa" class="btn btn--primary btn--lg" data-nav>${icon("map", 18)} <span data-i18n="nav_mapa">Ver mapa de ocorrências</span></a>
              <a href="#/denuncias" class="btn btn--ghost btn--lg" data-nav>${icon("lock", 18)} <span data-i18n="nav_denuncia">Fazer denúncia anônima</span></a>
            </div>
            <div class="hero__stats">
              <div class="hero__stat"><strong>${totalHoje}</strong><span data-i18n="stat_ocorrencias">Ocorrências mapeadas hoje</span></div>
              <div class="hero__stat"><strong>${altos}</strong><span data-i18n="stat_risco">Zonas de risco alto</span></div>
              <div class="hero__stat"><strong>100%</strong><span data-i18n="stat_anonimo">Denúncias anônimas</span></div>
            </div>
          </div>
          <div class="hero__panel" aria-hidden="true">
            <div class="hero__panel-bar">
              <span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span>
              <span class="hero__panel-title" data-i18n="alertas_tempo_real">Alertas em tempo real</span>
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
    if (!DATA) return "<p>" + t("carregando") + "</p>";
    const tiposChips = DATA.tipos.map((t) => `<button class="chip is-active" data-tipo="${t.id}" type="button">${t.nome}</button>`).join("");

    return `
      <section class="page-head">
        <div class="container page-head__row">
          <div>
            <h1 class="page-title" data-i18n="titulo_mapa">Mapa de ocorrências</h1>
            <p class="page-sub" data-i18n="sub_mapa">Visualize ocorrências em tempo real, filtre por tipo e severidade.</p>
          </div>
          <button class="btn btn--primary" id="btn-registrar" type="button">${icon("pin", 18)} <span data-i18n="btn_registrar">Registrar ocorrência</span></button>
        </div>
      </section>
      <section class="container">
        <div class="map-layout">
          <aside class="map-sidebar">
            <div class="stat-cards">
              <div class="stat"><div class="stat__value" id="stat-total">0</div><div class="stat__label" data-i18n="stat_ocorrencias">Ocorrências</div></div>
              <div class="stat"><div class="stat__value is-danger" id="stat-alto">0</div><div class="stat__label" data-i18n="stat_risco">Risco alto</div></div>
            </div>
            <div class="card" style="padding:18px">
              <div class="filter-group" style="margin-bottom:16px">
                <span class="filter-group__label" data-i18n="filtro_severidade">Severidade</span>
                <div class="chip-row" id="filtro-severidade">
                  <button class="chip is-active" data-sev="alto" type="button" data-i18n="sev_alto">Alto</button>
                  <button class="chip is-active" data-sev="medio" type="button" data-i18n="sev_medio">Médio</button>
                  <button class="chip is-active" data-sev="baixo" type="button" data-i18n="sev_baixo">Baixo</button>
                </div>
              </div>
              <div class="filter-group">
                <span class="filter-group__label" data-i18n="filtro_tipo">Tipo de ocorrência</span>
                <div class="chip-row" id="filtro-tipo">${tiposChips}</div>
              </div>
            </div>
            <div class="card" style="padding:18px">
              <span class="filter-group__label" style="display:block;margin-bottom:12px" data-i18n="ocorrencias_recentes">Ocorrências recentes</span>
              <div class="occ-list" id="occ-list"></div>
            </div>
          </aside>
          <div class="map-wrap">
            <div id="map" role="application" aria-label="Mapa de ocorrências"></div>
            <div class="map-controls">
              <button class="map-control-btn" id="btn-mylocation" type="button" data-i18n-title="btn_minha_localizacao">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
                <span data-i18n="btn_minha_localizacao">Minha localização</span>
              </button>
              <button class="map-control-btn" id="btn-heatmap" type="button" data-i18n-title="btn_heatmap">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                <span data-i18n="btn_heatmap">Mapa de calor</span>
              </button>
            </div>
            <div class="map-legend">
              <div class="map-legend__row"><span class="legend-dot" style="background:${DATA.severidades.alto.cor}"></span> <span data-i18n="stat_risco">Risco alto</span></div>
              <div class="map-legend__row"><span class="legend-dot" style="background:${DATA.severidades.medio.cor}"></span> <span data-i18n="stat_risco_medio">Risco médio</span></div>
              <div class="map-legend__row"><span class="legend-dot" style="background:${DATA.severidades.baixo.cor}"></span> <span data-i18n="stat_risco_baixo">Risco baixo</span></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function pageDenuncias() {
    const DATA = window.SENTINELA_DATA;
    if (!DATA || !DATA.tipos) return "<p>" + t("carregando") + "</p>";
    const tipoOpts = DATA.tipos.map((t) => `<option value="${t.id}">${t.nome}</option>`).join("");
    return `
      <section class="page-head"><div class="container"><span class="eyebrow">${icon("lock", 14)} <span data-i18n="nav_denuncia">Canal 100% anônimo</span></span><h1 class="page-title" style="margin-top:12px" data-i18n="nav_denuncia">Denúncia anônima</h1><p class="page-sub" data-i18n="sub_denuncia">Preencha os detalhes abaixo. Não coletamos seu nome, e-mail ou qualquer dado que possa identificar você.</p></div></section>
      <section class="container"><div class="form-grid"><form class="card card--pad-lg" id="form-denuncia" novalidate><div class="field"><label for="tipo" data-i18n="label_tipo_ocorrencia">Tipo de ocorrência</label><select class="select" id="tipo" required><option value="" disabled selected data-i18n="selecione_tipo">Selecione o tipo</option>${tipoOpts}</select></div><div class="field"><label data-i18n="label_severidade">Gravidade percebida</label><div class="severity-options"><label class="severity-opt"><input type="radio" name="sev" value="baixo"><strong data-i18n="sev_baixo">Baixo</strong><span data-i18n="sem_urgencia">Sem urgência</span></label><label class="severity-opt"><input type="radio" name="sev" value="medio" checked><strong data-i18n="sev_medio">Médio</strong><span data-i18n="requer_atencao">Requer atenção</span></label><label class="severity-opt"><input type="radio" name="sev" value="alto"><strong data-i18n="sev_alto">Alto</strong><span data-i18n="urgente">Urgente</span></label></div></div><div class="field-row"><div class="field"><label for="bairro" data-i18n="label_bairro">Bairro / região</label><input class="input" id="bairro" type="text" data-i18n-placeholder="placeholder_bairro" placeholder="Ex.: Bela Vista" required /></div><div class="field"><label for="quando" data-i18n="modal_detalhes_quando">Quando ocorreu</label><input class="input" id="quando" type="datetime-local" /></div></div><div class="field"><label for="descricao" data-i18n="modal_detalhes_descricao">Descrição</label><textarea class="textarea" id="descricao" data-i18n-placeholder="placeholder_descricao" placeholder="Descreva o que aconteceu..." required></textarea><span class="hint" data-i18n="hint_dados_pessoais">Não inclua nome, telefone ou dados pessoais.</span></div><button class="btn btn--primary btn--lg btn--block" type="submit">${icon("shield", 18)} <span data-i18n="btn_enviar_denuncia">Enviar denúncia anônima</span></button></form><aside class="aside-card"><div class="info-box info-box--accent"><h3 class="card__title" style="display:flex;gap:8px;align-items:center">${icon("lock", 18)} <span data-i18n="protecao_vem_primeiro">Sua proteção vem primeiro</span></h3><p class="card__desc" data-i18n="texto_protecao">Ao enviar, você recebe um código anônimo. Use-o para acompanhar o caso e conversar com o investigador.</p></div></aside></div></section>
    `;
  }

  function pageDenunciaEnviada(codigo) {
    return `<section class="container"><div class="chat-layout"><div class="card card--pad-lg code-result"><span class="card__icon" style="margin:0 auto 12px">${icon("check")}</span><p class="code-result__label" data-i18n="sucesso_registro">Denúncia registrada com sucesso. Guarde seu código anônimo:</p><div class="code-badge">${codigo}</div><p class="card__desc" style="max-width:440px;margin:0 auto 24px" data-i18n="use_codigo">Use este código para acompanhar o andamento e conversar com o investigador.</p><div class="hero__cta" style="justify-content:center;margin:0"><button class="btn btn--soft" id="btn-copiar" type="button" data-i18n="btn_copiar">Copiar código</button><a href="#/acompanhar?codigo=${codigo}" class="btn btn--primary" data-nav>${icon("chat", 16)} <span data-i18n="btn_abrir_chat">Abrir chat seguro</span></a></div></div></div></section>`;
  }

  function pageAcompanhar(codigo) {
    if (!codigo) {
      return `<section class="page-head"><div class="container"><h1 class="page-title" data-i18n="titulo_acompanhar">Acompanhar denúncia</h1><p class="page-sub" data-i18n="sub_acompanhar">Informe o código anônimo recebido para acessar o chat seguro.</p></div></section><section class="container"><div class="chat-layout"><form class="card card--pad-lg" id="form-codigo"><div class="field"><label for="codigo" data-i18n="label_codigo">Código anônimo</label><div class="input-group"><span class="input-prefix">DNC-</span><input class="input input-with-prefix" id="codigo" type="text" data-i18n-placeholder="placeholder_codigo" placeholder="Ex.: 4821" autocomplete="off" required maxlength="4" pattern="[0-9]*" /></div></div><button class="btn btn--primary btn--lg btn--block" type="submit">${icon("chat", 18)} <span data-i18n="btn_acessar_chat">Acessar chat seguro</span></button></form></div></section>`;
    }

    return `
      <section class="page-head">
        <div class="container page-head__row">
          <div>
            <h1 class="page-title" data-i18n="titulo_acompanhar">Acompanhar denúncia</h1>
            <p class="page-sub"><span data-i18n="nav_denuncia">Denúncia</span> <strong>${codigo}</strong> · <span data-i18n="comunicacao_criptografada">comunicação criptografada e anônima.</span></p>
          </div>
          <a href="#/acompanhar" class="btn btn--ghost btn--sm" data-nav data-i18n="trocar_codigo">Trocar código</a>
        </div>
      </section>
      <section class="container">
        <div class="chat-layout">
          <div class="chat-tabs">
            <button class="chat-tab is-active" data-tab="conversa">
              ${icon("chat", 16)} <span data-i18n="conversas">Conversa</span>
            </button>
            <button class="chat-tab" data-tab="historico">
              ${icon("clock", 16)} <span data-i18n="historico">Histórico</span>
            </button>
          </div>
          
          <div class="chat-tab-content" id="tab-conversa">
            <div class="chat">
              <div class="chat__head">
                <span class="chat__avatar">${icon("users")}</span>
                <div class="chat__who">
                  <strong data-i18n="investigador_responsavel">Investigador responsável</strong>
                  <span data-i18n="online">Online</span>
                </div>
                <span class="chat__lock">${icon("lock", 15)} <span data-i18n="criptografado">Criptografado</span></span>
              </div>
              <div class="chat__body" id="chat-body"></div>
              <form class="chat__foot" id="chat-form">
                <input class="input" id="chat-input" type="text" data-i18n-placeholder="placeholder_mensagem" placeholder="Escreva sua mensagem…" autocomplete="off" aria-label="Mensagem" />
                <button class="btn btn--primary" type="submit" aria-label="Enviar">${icon("send", 18)} <span data-i18n="btn_enviar">Enviar</span></button>
              </form>
            </div>
          </div>
          
          <div class="chat-tab-content" id="tab-historico" style="display: none;">
            <div class="timeline-card">
              <div class="timeline-header">
                <h3>${icon("clock", 20)} <span data-i18n="linha_do_tempo">Linha do Tempo</span></h3>
                <p data-i18n="todas_acoes">Todas as ações realizadas nesta denúncia</p>
              </div>
              <div class="timeline-container" id="timeline-publica">
                <p style="text-align: center; color: var(--text-muted); padding: 20px;" data-i18n="carregando_historico">Carregando histórico...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function pageLogin() {
    return `<section class="page-head"><div class="container"><h1 class="page-title" data-i18n="acesso_restrito">Acesso Restrito</h1><p class="page-sub" data-i18n="painel_investigador">Painel do Investigador</p></div></section><section class="container"><div class="chat-layout"><form class="card card--pad-lg" id="form-login"><div class="field"><label for="email" data-i18n="email">E-mail</label><input class="input" id="email" type="email" value="admin@sentinela.com" required /></div><div class="field"><label for="senha" data-i18n="senha">Senha</label><input class="input" id="senha" type="password" value="admin123" required /></div><button class="btn btn--primary btn--lg btn--block" type="submit" data-i18n="btn_entrar">Entrar</button></form></div></section>`;
  }

  function pagePainel() {
    return `<section class="page-head"><div class="container page-head__row"><div><h1 class="page-title" data-i18n="painel_investigador">Painel do Investigador</h1><p class="page-sub" data-i18n="gerenciando_denuncias">Gerenciamento de denúncias</p></div><div style="display: flex; gap: 10px;"><button class="btn btn--soft btn--sm" id="btn-export-csv">${icon("chart", 16)} <span data-i18n="btn_exportar_csv">Exportar CSV</span></button><button class="btn btn--soft btn--sm" id="btn-export-pdf">${icon("chart", 16)} <span data-i18n="btn_exportar_pdf">Exportar PDF</span></button><button class="btn btn--ghost btn--sm" id="btn-logout" data-i18n="btn_sair">Sair</button></div></div></section><section class="container"><div class="card card--pad-lg"><div id="tabela-denuncias" data-i18n="carregando">Carregando...</div></div></section>`;
  }

  function pageDashboard() {
    return `
      <section class="page-head">
        <div class="container">
          <h1 class="page-title" data-i18n="dashboard_titulo">Dashboard de Estatísticas</h1>
          <p class="page-sub" data-i18n="dashboard_sub">Análise visual e tendências das ocorrências registradas</p>
        </div>
      </section>
      <section class="container" style="padding-bottom: 56px;">
        <div class="section__head" style="margin-top: 20px;">
          <h2 class="section__title" style="font-size: 1.3rem;" data-i18n="tendencias_7_dias">Tendências (Últimos 7 dias)</h2>
        </div>
        <div class="tendencias-grid" id="tendencias-grid">
          <p style="color: var(--text-muted);" data-i18n="carregando">Carregando tendências...</p>
        </div>
        <div class="section__head" style="margin-top: 40px;">
          <h2 class="section__title" style="font-size: 1.3rem;" data-i18n="graficos_detalhados">Gráficos Detalhados</h2>
        </div>
        <div class="dashboard-grid">
          <div class="card card--pad-lg">
            <h3 class="card__title" data-i18n="ocorrencias_por_tipo">Ocorrências por Tipo</h3>
            <div class="chart-container"><canvas id="chart-tipos"></canvas></div>
          </div>
          <div class="card card--pad-lg">
            <h3 class="card__title" data-i18n="nivel_severidade">Nível de Severidade</h3>
            <div class="chart-container"><canvas id="chart-severidade"></canvas></div>
          </div>
          <div class="card card--pad-lg">
            <h3 class="card__title" data-i18n="top_5_bairros">Top 5 Bairros</h3>
            <div class="chart-container"><canvas id="chart-bairros"></canvas></div>
          </div>
          <div class="card card--pad-lg" style="grid-column: 1 / -1;">
            <h3 class="card__title" data-i18n="ocorrencias_7_dias">Ocorrências nos últimos 7 dias</h3>
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
          <span class="eyebrow">${icon("chart", 14)} <span data-i18n="analise_preditiva">Análise Preditiva</span></span>
          <h1 class="page-title" style="margin-top: 12px;" data-i18n="inteligencia_estatistica">Inteligência Estatística</h1>
          <p class="page-sub" data-i18n="padroes_detectados">Padrões detectados automaticamente nos últimos 30 dias de ocorrências</p>
        </div>
      </section>
      <section class="container" style="padding-bottom: 56px;">
        <div id="previsao-loading" style="text-align: center; padding: 40px; color: var(--text-muted);" data-i18n="analisando_padroes">
          Analisando padrões históricos...
        </div>
        <div id="previsao-cards" style="display: none;"></div>
        <div id="previsao-vazia" style="display: none; text-align: center; padding: 60px 20px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-faint); margin-bottom: 16px;">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <h3 style="margin-bottom: 8px;" data-i18n="dados_insuficientes">Dados insuficientes</h3>
          <p style="color: var(--text-muted); max-width: 400px; margin: 0 auto;" data-i18n="necessario_30_dias">
            São necessários pelo menos 30 dias de dados com ocorrências registradas para gerar previsões confiáveis.
          </p>
        </div>
      </section>
    `;
  }

  function initDashboard() {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(data => renderCharts(data))
      .catch(err => console.error("Erro no dashboard:", err));

    fetch("/api/tendencias")
      .then(res => res.json())
      .then(data => renderTendencias(data))
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
      container.innerHTML = `<p style="color: var(--text-muted);" data-i18n="dados_insuficientes">Dados insuficientes para análise de tendências.</p>`;
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

    if (!loading) return;

    const token = localStorage.getItem("sentinela_token");

    if (!token) {
      loading.innerHTML = `<p style="color: var(--text-muted);" data-i18n="faça_login_previsoes">Faça login para ver as previsões.</p>`;
      setTimeout(() => { window.location.hash = "#/login"; }, 2000);
      return;
    }

    fetch("/api/painel/previsao", {
      headers: { "Authorization": "Bearer " + token }
    })
      .then(res => {
        if (res.status === 401) {
          window.location.hash = "#/login";
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;

        loading.style.display = "none";

        if (!data.previsoes || data.previsoes.length === 0) {
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
                    <span class="previsao-info-label" data-i18n="quando"> Quando</span>
                    <span class="previsao-info-value">${diaNome} · ${faixaNome}</span>
                  </div>
                  <div class="previsao-info-item">
                    <span class="previsao-info-label">📍 <span data-i18n="onde">Onde</span></span>
                    <span class="previsao-info-value">${p.bairro}</span>
                  </div>
                  <div class="previsao-info-item">
                    <span class="previsao-info-label" data-i18n="previsao"> Previsão</span>
                    <span class="previsao-info-value">${p.media_ocorrencias} ocorrências</span>
                  </div>
                </div>
                <div class="previsao-footer">
                  <span class="previsao-variacao" style="color: ${badgeCor};">
                    ${p.percentual_acima > 0 ? '+' : ''}${p.percentual_acima}% acima da média
                  </span>
                  <span class="previsao-amostras" data-i18n="baseado_em">
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
          loading.innerHTML = `<p style="color: var(--danger);" data-i18n="erro_carregar_previsoes">Erro ao carregar previsões: ${err.message}</p>`;
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

  function filteredOccurrences() {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) return [];
    return DATA.ocorrencias.filter((o) => {
      const sevMatch = activeFilters.sev.has(o.severidade);
      const tipoMatch = activeFilters.tipo.size === 0 || activeFilters.tipo.has(String(o.tipo));
      return sevMatch && tipoMatch;
    });
  }

  async function renderMarkers(map) {
    console.log("📍 Renderizando marcadores...");
    const DATA = window.SENTINELA_DATA;
    if (!DATA) {
      console.error("❌ SENTINELA_DATA não encontrado");
      return;
    }

    mapMarkers.forEach((m) => m.setMap(null));
    mapMarkers = [];

    const list = filteredOccurrences();
    console.log(`📊 Ocorrências filtradas: ${list.length} de ${DATA.ocorrencias.length} totais`);

    const ids = list.map(o => o.id);
    await carregarEstatisticasConfirmacoes(ids);

    list.forEach((o, index) => {
      if (!o.lat || !o.lng) {
        console.warn(`⚠️ Ocorrência ${index} sem coordenadas:`, o);
        return;
      }

      const severidadeKey = String(o.severidade).toLowerCase();
      const severidadeData = DATA.severidades[severidadeKey];
      
      var cor;
      if (severidadeKey == 'alto') cor = '#ef5a63';
      else if (severidadeKey == 'medio') cor = '#f4a63b';
      else cor = '#17b8a6';

      var scale;
      if (severidadeKey == 'alto') scale = 13;
      else if (severidadeKey == 'medio') scale = 10;
      else scale = 8;

      const marker = new google.maps.Marker({
        position: { lat: parseFloat(o.lat), lng: parseFloat(o.lng) },
        map: map,
        title: o.titulo,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: scale,
          fillColor: cor,
          fillOpacity: 0.85,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      const stats = estatisticasConfirmacoes[o.id] || { confirmou: 0, falsa: 0 };
      const severidadeNome = severidadeData?.nome || (severidadeKey === 'alto' ? 'Alto' : severidadeKey === 'medio' ? 'Médio' : 'Baixo');

      const infoWindowContent = `
        <div style="min-width: 280px; font-family: 'Inter', sans-serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="display: inline-block; padding: 4px 10px; background: ${cor}20; color: ${cor}; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
              ${severidadeNome}
            </span>
          </div>
          <div style="font-weight: 700; margin-bottom: 6px; color: #101a2e; font-size: 15px;">${o.titulo || "Ocorrência"}</div>
          <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 10px;">📍 ${o.bairro || t("nao_informado")} · ${o.tempo || ""}</div>
          <div style="font-size: 0.9rem; color: #334155; margin-bottom: 12px; line-height: 1.5;">${o.desc || o.descricao || t("sem_descricao")}</div>
          
          <div style="display: flex; gap: 12px; margin: 12px 0; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <div style="flex: 1; text-align: center; padding: 8px; background: rgba(23, 184, 166, 0.1); border-radius: 6px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 4px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                <span style="font-size: 1.2rem; font-weight: 700; color: #17b8a6;">${stats.confirmou}</span>
              </div>
              <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;" data-i18n="confirmaram">confirmaram</div>
            </div>
            <div style="flex: 1; text-align: center; padding: 8px; background: rgba(239, 90, 99, 0.1); border-radius: 6px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 4px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef5a63" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                <span style="font-size: 1.2rem; font-weight: 700; color: #ef5a63;">${stats.falsa}</span>
              </div>
              <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;" data-i18n="reportaram">reportaram</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
            <button onclick="confirmarOcorrencia(${o.id}, 'confirmou')" style="flex: 1; padding: 8px 12px; background: #17b8a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span data-i18n="confirmar">Confirmar</span>
            </button>
            <button onclick="confirmarOcorrencia(${o.id}, 'falsa')" style="flex: 1; padding: 8px 12px; background: #ef5a63; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              <span data-i18n="falsa">Falsa</span>
            </button>
          </div>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({ content: infoWindowContent });
      marker.addListener("click", () => { infoWindow.open(map, marker); });
      marker._occId = o.id;
      mapMarkers.push(marker);
    });

    console.log(`✅ ${mapMarkers.length} marcadores renderizados`);

    if ($("#stat-total")) $("#stat-total").textContent = list.length;
    const alto = list.filter((o) => String(o.severidade).toLowerCase() === 'alto').length;
    if ($("#stat-alto")) $("#stat-alto").textContent = alto;

    renderOccList(list, map);
  }

  function toggleHeatmap(map) {
    heatmapAtivo = !heatmapAtivo;
    const btn = $("#btn-heatmap");

    if (heatmapAtivo) {
      if (btn) {
        btn.classList.add("is-active");
        btn.innerHTML = `${icon("chart", 18)} <span data-i18n="desativar_heatmap">Desativar mapa de calor</span>`;
      }
      mapMarkers.forEach((m) => m.setMap(null));
      const DATA = window.SENTINELA_DATA;
      if (!DATA) return;
      const list = filteredOccurrences();
      const heatmapData = list.map(o => {
        let weight = 1;
        if (o.severidade === 'alto') weight = 3;
        else if (o.severidade === 'medio') weight = 2;
        else if (o.severidade === 'baixo') weight = 1;
        return { location: new google.maps.LatLng(parseFloat(o.lat), parseFloat(o.lng)), weight: weight };
      });

      heatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmapData, map: map, radius: 30, opacity: 0.6, dissipating: true,
        gradient: ['rgba(23, 184, 166, 0.4)', 'rgba(244, 166, 59, 0.5)', 'rgba(239, 90, 99, 0.6)', 'rgba(239, 90, 99, 0.8)']
      });
      showToast("🔥 " + t("heatmap_ativado"));
    } else {
      if (heatmapLayer) { heatmapLayer.setMap(null); heatmapLayer = null; }
      if (btn) {
        btn.classList.remove("is-active");
        btn.innerHTML = `${icon("chart", 18)} <span data-i18n="btn_heatmap">Mapa de calor</span>`;
      }
      renderMarkers(map);
      showToast("🗺️ " + t("heatmap_desativado"));
    }
  }

  window.confirmarOcorrencia = async function (ocorrenciaId, tipo) {
    const token = getTokenUsuario();
    try {
      const res = await fetch("/api/confirmacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocorrencia_id: ocorrenciaId, tipo_confirmacao: tipo, token_usuario: token })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(tipo === 'confirmou' ? "✅ " + t("ocorrencia_confirmada") : "🚫 " + t("ocorrencia_falsa"));
        if (window.__sentinelaMap) renderMarkers(window.__sentinelaMap);
      } else {
        showToast(data.error || t("erro_registrar_confirmacao"));
      }
    } catch (err) {
      console.error("Erro ao confirmar ocorrência:", err);
      showToast(t("erro_conexao"));
    }
  };

  let marcadorTemporario = null;
  let coordenadasSelecionadas = null;

  function abrirModalRegistro(lat, lng) {
    const modalExistente = document.getElementById("modal-overlay");
    if (modalExistente) modalExistente.remove();

    const DATA = window.SENTINELA_DATA;
    if (!DATA) { showToast(t("dados_nao_carregados")); return; }

    const tipoOpts = DATA.tipos.map((t) => `<option value="${t.id}">${t.nome}</option>`).join("");

    const modalHTML = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${icon("pin", 20)} <span data-i18n="modal_registro_titulo">Registrar nova ocorrência</span></h3>
            <button class="modal-close" id="modal-close" type="button" aria-label="Fechar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-info">${icon("map", 16)} <span data-i18n="local_selecionado">Local:</span> <strong>${lat.toFixed(5)}, ${lng.toFixed(5)}</strong></p>
            <div class="field">
              <label for="modal-tipo" data-i18n="label_tipo_ocorrencia">Tipo de ocorrência *</label>
              <select class="select" id="modal-tipo" required>
                <option value="" disabled selected data-i18n="selecione_tipo">Selecione o tipo</option>
                ${tipoOpts}
              </select>
            </div>
            <div class="field">
              <label data-i18n="label_severidade">Severidade *</label>
              <div class="severity-options">
                <label class="severity-opt"><input type="radio" name="modal-sev" value="baixo"><strong data-i18n="sev_baixo">Baixo</strong><span data-i18n="sem_urgencia">Sem urgência</span></label>
                <label class="severity-opt"><input type="radio" name="modal-sev" value="medio" checked><strong data-i18n="sev_medio">Médio</strong><span data-i18n="requer_atencao">Requer atenção</span></label>
                <label class="severity-opt"><input type="radio" name="modal-sev" value="alto"><strong data-i18n="sev_alto">Alto</strong><span data-i18n="urgente">Urgente</span></label>
              </div>
            </div>
            <div class="field">
              <label for="modal-bairro" data-i18n="label_bairro">Bairro / região *</label>
              <input class="input" id="modal-bairro" type="text" data-i18n-placeholder="placeholder_bairro" placeholder="Ex.: Bela Vista" required />
            </div>
            <div class="field">
              <label for="modal-desc" data-i18n="label_descricao_modal">Descrição *</label>
              <textarea class="textarea" id="modal-desc" rows="3" data-i18n-placeholder="placeholder_descricao" placeholder="Descreva o que aconteceu..." required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn--ghost" id="modal-cancelar" type="button" data-i18n="btn_cancelar">Cancelar</button>
            <button class="btn btn--primary" id="modal-confirmar" type="button">${icon("check", 18)} <span data-i18n="btn_confirmar_registro">Registrar ocorrência</span></button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    setTimeout(() => {
      const modalClose = $("#modal-close");
      const modalCancelar = $("#modal-cancelar");
      const modalOverlay = $("#modal-overlay");
      const modalConfirmar = $("#modal-confirmar");

      if (modalClose) modalClose.addEventListener("click", fecharModalRegistro);
      if (modalCancelar) modalCancelar.addEventListener("click", fecharModalRegistro);
      if (modalOverlay) modalOverlay.addEventListener("click", (e) => { if (e.target.id === "modal-overlay") fecharModalRegistro(); });
      if (modalConfirmar) modalConfirmar.addEventListener("click", () => confirmarRegistroOcorrencia(lat, lng));
    }, 100);
  }

  function fecharModalRegistro() {
    const modal = $("#modal-overlay");
    if (modal) {
      modal.classList.add("modal-closing");
      setTimeout(() => { if (modal.parentNode) modal.remove(); }, 200);
    }
    if (marcadorTemporario) { marcadorTemporario.setMap(null); marcadorTemporario = null; }
    coordenadasSelecionadas = null;
  }

  async function confirmarRegistroOcorrencia(lat, lng) {
    const DATA = window.SENTINELA_DATA;
    if (!DATA) { showToast(t("dados_nao_carregados")); return; }

    const tipoSelect = $("#modal-tipo");
    const tipoId = tipoSelect?.value;
    const bairro = $("#modal-bairro")?.value.trim();
    const desc = $("#modal-desc")?.value.trim();
    const sevRadio = document.querySelector('input[name="modal-sev"]:checked');
    const severidade = sevRadio?.value || "medio";

    if (!tipoId) { showToast("Selecione o tipo de ocorrência."); if (tipoSelect) tipoSelect.focus(); return; }
    if (!bairro) { showToast("Informe o bairro/região."); const bairroInput = $("#modal-bairro"); if (bairroInput) bairroInput.focus(); return; }
    if (!desc) { showToast("Adicione uma descrição."); const descInput = $("#modal-desc"); if (descInput) descInput.focus(); return; }

    const btnConfirmar = $("#modal-confirmar");
    if (btnConfirmar) { btnConfirmar.disabled = true; btnConfirmar.innerHTML = `${icon("pin", 18)} ` + t("salvando"); }

    try {
      const response = await fetch("/api/ocorrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_id: Number(tipoId), severidade_id: severidade,
          titulo: `${DATA.tipos.find(t => t.id === Number(tipoId))?.nome || "Ocorrência"} registrada`,
          bairro: bairro, tempo: "agora", lat: lat, lng: lng, descricao: desc,
        }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Erro ao registrar ocorrência");

      showToast("✅ " + t("sucesso_registro"));
      fecharModalRegistro();
      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (error) {
      console.error("Erro ao registrar ocorrência:", error);
      showToast(t("erro_registrar") + ": " + error.message);
      if (btnConfirmar) { btnConfirmar.disabled = false; btnConfirmar.innerHTML = `${icon("check", 18)} ` + t("btn_confirmar_registro"); }
    }
  }

  function renderOccList(list, map) {
    const DATA = window.SENTINELA_DATA;
    const el = $("#occ-list");
    if (!el || !DATA) return;
    if (!list.length) { el.innerHTML = `<p class="card__desc" data-i18n="nenhuma_ocorrencia_filtro">Nenhuma ocorrência com os filtros atuais.</p>`; return; }

    el.innerHTML = list.slice(0, 6).map((o) => `
      <button class="occ-item" data-occ="${o.id}" type="button">
        <span class="mini-badge badge--${o.severidade}">${DATA.severidades[o.severidade].nome}</span>
        <span class="occ-item__body">
          <span class="occ-item__title">${o.titulo}</span>
          <span class="occ-item__meta">${o.bairro} · ${o.tempo}</span>
        </span>
      </button>`).join("");

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

  function initMapa() {
    console.log("🗺️ Iniciando mapa...");
    const DATA = window.SENTINELA_DATA;
    if (!DATA) { console.error("❌ Dados não carregados"); setTimeout(initMapa, 500); return; }
    if (DATA.tipos && activeFilters.tipo.size === 0) {
      activeFilters.tipo = new Set(DATA.tipos.map(t => String(t.id)));
      console.log("✅ Filtros de tipo inicializados:", Array.from(activeFilters.tipo));
    }
    if (!googleMapsReady) { console.log("⏳ Google Maps não está pronto..."); setTimeout(initMapa, 500); return; }
    const mapElement = document.getElementById("map");
    if (!mapElement) { console.error("❌ Elemento #map não encontrado"); setTimeout(initMapa, 500); return; }
    if (window.__sentinelaMap) { console.log("ℹ️ Mapa já existe, atualizando marcadores..."); renderMarkers(window.__sentinelaMap); return; }

    console.log("📍 Criando mapa em:", DATA.center);
    const map = new google.maps.Map(mapElement, { center: { lat: DATA.center[0], lng: DATA.center[1] }, zoom: DATA.zoom });
    window.__sentinelaMap = map;
    console.log("✅ Mapa criado com sucesso!");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
          map.setCenter(userLocation);
          map.setZoom(15);
          new google.maps.Marker({
            position: userLocation, map: map, title: "Sua localização",
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#17b8a6", fillOpacity: 0.85, strokeColor: "#ffffff", strokeWeight: 2 }
          });
          showToast("📍 " + t("localizacao_centralizada"));
        },
        (error) => {
          console.warn("⚠️ Localização não obtida:", error.message);
          map.setCenter({ lat: DATA.center[0], lng: DATA.center[1] });
          map.setZoom(DATA.zoom);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn("⚠️ Geolocalização não suportada pelo navegador");
      map.setCenter({ lat: DATA.center[0], lng: DATA.center[1] });
      map.setZoom(DATA.zoom);
      showToast("⚠️ " + t("geo_nao_suportada"));
    }

    setTimeout(() => { renderMarkers(map); }, 100);

    $$("#filtro-severidade .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const s = chip.dataset.sev;
        chip.classList.toggle("is-active");
        chip.classList.contains("is-active") ? activeFilters.sev.add(s) : activeFilters.sev.delete(s);
        renderMarkers(map);
      });
    });

    $$("#filtro-tipo .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const t_val = chip.dataset.tipo;
        chip.classList.toggle("is-active");
        chip.classList.contains("is-active") ? activeFilters.tipo.add(t_val) : activeFilters.tipo.delete(t_val);
        renderMarkers(map);
      });
    });

    $("#btn-heatmap")?.addEventListener("click", () => { if (window.__sentinelaMap) toggleHeatmap(window.__sentinelaMap); });
    $("#btn-mylocation")?.addEventListener("click", () => { if (window.__sentinelaMap) centralizarNaLocalizacaoUsuario(window.__sentinelaMap); });

    let modoRegistro = false;
    $("#btn-registrar")?.addEventListener("click", () => {
      modoRegistro = !modoRegistro;
      if (modoRegistro) {
        $("#btn-registrar").classList.remove("btn--primary");
        $("#btn-registrar").classList.add("btn--soft");
        $("#btn-registrar").innerHTML = `${icon("pin", 18)} ` + t("clique_mapa");
        map.getDiv().style.cursor = "crosshair";
        showToast(t("clique_mapa"));
      } else {
        $("#btn-registrar").classList.add("btn--primary");
        $("#btn-registrar").classList.remove("btn--soft");
        $("#btn-registrar").innerHTML = `${icon("pin", 18)} ` + `<span data-i18n="btn_registrar">${t("btn_registrar")}</span>`;
        map.getDiv().style.cursor = "";
        if (marcadorTemporario) { marcadorTemporario.setMap(null); marcadorTemporario = null; }
        coordenadasSelecionadas = null;
      }
    });

    map.addListener("click", (e) => {
      if (!modoRegistro) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (marcadorTemporario) marcadorTemporario.setMap(null);
      coordenadasSelecionadas = { lat, lng };
      marcadorTemporario = new google.maps.Marker({
        position: { lat, lng }, map: map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: "#3b82f6", fillOpacity: 0.6, strokeColor: "#1d4ed8", strokeWeight: 2 },
        title: "Local selecionado",
      });
      abrirModalRegistro(lat, lng);
      modoRegistro = false;
      $("#btn-registrar").classList.add("btn--primary");
      $("#btn-registrar").classList.remove("btn--soft");
      $("#btn-registrar").innerHTML = `${icon("pin", 18)} ` + `<span data-i18n="btn_registrar">${t("btn_registrar")}</span>`;
      map.getDiv().style.cursor = "";
    });
  }

  function centralizarNaLocalizacaoUsuario(map) {
    if (!navigator.geolocation) { showToast("⚠️ " + t("geo_nao_suportada")); return; }
    showToast("📍 " + t("buscando_localizacao"));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        map.setCenter(userLocation);
        map.setZoom(15);
        if (window.userLocationMarker) window.userLocationMarker.setMap(null);
        window.userLocationMarker = new google.maps.Marker({
          position: userLocation, map: map, title: "Sua localização", zIndex: 9999,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#4285F4", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 }
        });
        showToast("✅ " + t("localizacao_centralizada"));
      },
      (error) => {
        console.warn("⚠️ Localização negada ou indisponível:", error.message);
        if (error.code === error.PERMISSION_DENIED) showToast("❌ " + t("localizacao_negada"));
        else if (error.code === error.POSITION_UNAVAILABLE) showToast("⚠️ " + t("localizacao_indisponivel"));
        else if (error.code === error.TIMEOUT) showToast("⏱️ " + t("tempo_esgotado"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
      } catch (error) { showToast(t("erro_enviar_denuncia") + ": " + error.message); }
    });
  }

  function initDenunciaEnviada() {
    const btn = $("#btn-copiar");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const code = $(".code-badge").textContent.trim();
      navigator.clipboard?.writeText(code).then(() => showToast(t("codigo_copiado")), () => showToast(t("copie_manualmente") + ": " + code));
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
          $$(".chat-tab-content").forEach(content => { content.style.display = "none"; });
          document.getElementById(`tab-${tabName}`).style.display = "block";
          if (tabName === "historico") carregarTimelinePublica(codigo);
        });
      });
      initChat(codigo);
    }, 100);
  }

  async function carregarTimelinePublica(codigo) {
    const container = document.getElementById("timeline-publica");
    if (!container) return;
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;" data-i18n="carregando_historico">Carregando histórico...</p>`;
    try {
      const res = await fetch(`/api/timeline-publica/${encodeURIComponent(codigo)}`);
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
      const eventos = await res.json();
      if (!eventos || eventos.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;" data-i18n="nenhum_evento">Nenhum evento registrado ainda.</p>`;
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
          </div>`;
      }).join("");
    } catch (err) {
      console.error("Erro ao carregar timeline:", err);
      container.innerHTML = `<p style="text-align: center; color: var(--danger); padding: 20px;">` + t("erro_carregar_historico") + `: ${err.message}</p>`;
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
      addBubble({ autor: "system", texto: t("erro_carregar_chat") });
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
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ denuncia_id: denunciaId, autor: "out", texto: val, hora: horaEnvio })
        });
        const data = await res.json();
        if (data.resposta) {
          setTimeout(() => addBubble({ autor: data.resposta.autor, texto: data.resposta.texto, hora: data.resposta.hora }), 900);
        }
      } catch (error) { showToast(t("erro_enviar_mensagem")); }
    });
  }

  function initLogin() {
    const form = $("#form-login");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: $("#email").value, senha: $("#senha").value })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("sentinela_token", data.token);
          window.location.hash = "#/painel";
        } else {
          showToast(data.error);
        }
      } catch (err) { showToast(t("erro_conexao")); }
    });
  }

  function initPainel() {
    const token = localStorage.getItem("sentinela_token");
    if (!token) { window.location.hash = "#/login"; return; }
    $("#btn-logout")?.addEventListener("click", () => { localStorage.removeItem("sentinela_token"); window.location.hash = "#/inicio"; });
    $("#btn-export-csv")?.addEventListener("click", () => window.open("/api/painel/relatorio/csv?token=" + token, "_blank"));
    $("#btn-export-pdf")?.addEventListener("click", () => window.open("/api/painel/relatorio/pdf?token=" + token, "_blank"));
    fetchDenuncias(token);
  }

  async function fetchDenuncias(token) {
    const container = $("#tabela-denuncias");
    if (!container) return;
    container.innerHTML = t("carregando");
    try {
      const res = await fetch("/api/painel/denuncias", { headers: { "Authorization": "Bearer " + token } });
      if (res.status === 401) { localStorage.removeItem("sentinela_token"); window.location.hash = "#/login"; return; }
      const data = await res.json();
      renderTabelaDenuncias(data, container, token);
    } catch (err) { container.innerHTML = t("erro_carregar_dados"); }
  }

  function renderTabelaDenuncias(denuncias, container, token) {
    if (!denuncias || !denuncias.length) { container.innerHTML = "<p>" + t("nenhuma_denuncia") + "</p>"; return; }
    let htmlDesktop = `<table class="tabela-denuncias" style="width:100%; border-collapse: collapse;"><thead><tr>
      <th style="text-align:left; padding:12px 8px; border-bottom: 2px solid var(--border);" data-i18n="coluna_codigo">Código</th>
      <th style="text-align:left; padding:12px 8px; border-bottom: 2px solid var(--border);" data-i18n="coluna_tipo">Tipo</th>
      <th style="text-align:left; padding:12px 8px; border-bottom: 2px solid var(--border);" data-i18n="coluna_bairro">Bairro</th>
      <th style="text-align:left; padding:12px 8px; border-bottom: 2px solid var(--border);" data-i18n="coluna_status">Status</th>
      <th style="text-align:left; padding:12px 8px; border-bottom: 2px solid var(--border);" data-i18n="coluna_acoes">Ações</th>
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
              <option value="aberta" ${d.status === 'aberta' ? 'selected' : ''} data-i18n="status_aberta">Aberta</option>
              <option value="em_analise" ${d.status === 'em_analise' ? 'selected' : ''} data-i18n="status_em_analise">Em Análise</option>
              <option value="resolvida" ${d.status === 'resolvida' ? 'selected' : ''} data-i18n="status_resolvida">Resolvida</option>
              <option value="arquivada" ${d.status === 'arquivada' ? 'selected' : ''} data-i18n="status_arquivada">Arquivada</option>
            </select>
            <div class="btn-group-acoes">
              <button class="btn-acao-painel btn-acao-detalhes" data-id="${d.id}" data-codigo="${d.codigo_anonimo}" data-i18n="acao_detalhes">Detalhes</button>
              <button class="btn-acao-painel btn-acao-chat" data-id="${d.id}" data-codigo="${d.codigo_anonimo}" data-i18n="acao_chat">Chat</button>
              <button class="btn-acao-painel btn-acao-historico" data-id="${d.id}" data-i18n="acao_historico">Histórico</button>
            </div>
          </td>
        </tr>`;
      htmlMobile += `
        <div class="denuncia-card" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-family: monospace; font-weight: bold;">${d.codigo_anonimo}</span>
            <span class="mini-badge badge--${badgeClass}">${d.status}</span>
          </div>
          <div style="font-size: 0.9rem; margin-bottom: 8px;"><strong data-i18n="coluna_tipo">Tipo:</strong> ${d.tipo_nome}</div>
          <div style="font-size: 0.9rem; margin-bottom: 16px;"><strong data-i18n="coluna_bairro">Bairro:</strong> ${d.bairro}</div>
          <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; display: block;" data-i18n="label_alterar_status">Alterar status:</label>
          <select class="select status-select" data-id="${d.id}" style="width: 100%; padding: 10px; font-size: 0.95rem; margin-bottom: 12px;">
            <option value="aberta" ${d.status === 'aberta' ? 'selected' : ''} data-i18n="status_aberta">Aberta</option>
            <option value="em_analise" ${d.status === 'em_analise' ? 'selected' : ''} data-i18n="status_em_analise">Em Análise</option>
            <option value="resolvida" ${d.status === 'resolvida' ? 'selected' : ''} data-i18n="status_resolvida">Resolvida</option>
            <option value="arquivada" ${d.status === 'arquivada' ? 'selected' : ''} data-i18n="status_arquivada">Arquivada</option>
          </select>
          <div class="btn-group-acoes">
            <button class="btn-acao-painel btn-acao-detalhes" data-id="${d.id}" data-codigo="${d.codigo_anonimo}" data-i18n="acao_detalhes">Detalhes</button>
            <button class="btn-acao-painel btn-acao-chat" data-id="${d.id}" data-codigo="${d.codigo_anonimo}" data-i18n="acao_chat">Chat</button>
            <button class="btn-acao-painel btn-acao-historico" data-id="${d.id}" data-i18n="acao_historico">Histórico</button>
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
            method: "PUT", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ status })
          });
          if (res.ok) { showToast(t("status_atualizado")); fetchDenuncias(token); }
          else { showToast(t("erro_atualizar")); select.disabled = false; }
        } catch (err) { showToast(t("erro_conexao")); select.disabled = false; }
      });
    });

    container.querySelectorAll(".btn-acao-detalhes").forEach(btn => { btn.addEventListener("click", () => abrirModalDetalhes(btn.dataset.id, token)); });
    container.querySelectorAll(".btn-acao-chat").forEach(btn => { btn.addEventListener("click", () => abrirModalChatInvestigador(btn.dataset.id, btn.dataset.codigo, token)); });
    container.querySelectorAll(".btn-acao-historico").forEach(btn => { btn.addEventListener("click", () => abrirModalTimeline(btn.dataset.id, token)); });
  }

  async function abrirModalDetalhes(id, token) {
    const modalHTML = `
      <div class="modal-overlay" id="modal-detalhes-overlay" style="display:flex; z-index: 2000;">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title" data-i18n="modal_detalhes_titulo">Detalhes da Denúncia</h3>
            <button class="modal-close" onclick="document.getElementById('modal-detalhes-overlay').remove()">✕</button>
          </div>
          <div id="detalhes-body" style="padding: 20px; text-align: center; color: var(--text-muted);" data-i18n="carregando">Carregando detalhes...</div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    try {
      const res = await fetch(`/api/painel/denuncias/${id}`, { headers: { "Authorization": "Bearer " + token } });
      if (!res.ok) throw new Error("Falha ao buscar");
      const data = await res.json();
      document.getElementById("detalhes-body").innerHTML = `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;"><strong style="color: var(--text-muted); font-size: 0.9rem;" data-i18n="modal_detalhes_codigo">Código:</strong><div style="font-family: monospace; color: var(--primary); font-size: 1.1rem;">${data.codigo_anonimo}</div></div>
          <div style="margin-bottom: 16px;"><strong style="color: var(--text-muted); font-size: 0.9rem;" data-i18n="modal_detalhes_tipo">Tipo:</strong><div>${data.tipo_nome}</div></div>
          <div style="margin-bottom: 16px;"><strong style="color: var(--text-muted); font-size: 0.9rem;" data-i18n="modal_detalhes_bairro">Bairro:</strong><div>${data.bairro}</div></div>
          <div style="margin-bottom: 16px;"><strong style="color: var(--text-muted); font-size: 0.9rem;" data-i18n="modal_detalhes_status">Status:</strong><div><span class="mini-badge badge--${data.status === 'aberta' ? 'baixo' : data.status === 'em_analise' ? 'medio' : 'alto'}">${data.status}</span></div></div>
          <div style="margin-bottom: 16px;"><strong style="color: var(--text-muted); font-size: 0.9rem;" data-i18n="modal_detalhes_quando">Quando ocorreu:</strong><div>${data.quando_ocorreu ? new Date(data.quando_ocorreu).toLocaleString('pt-BR') : t("nao_informado")}</div></div>
          <div style="margin-top: 24px; padding: 16px; border-radius: 8px;">
            <strong style="color: var(--text-muted); font-size: 0.9rem; display: block; margin-bottom: 8px;" data-i18n="modal_detalhes_descricao">Descrição:</strong>
            <div style="color: var(--text-muted); line-height: 1.6;">${data.descricao || t("sem_descricao")}</div>
          </div>
        </div>`;
    } catch (err) {
      document.getElementById("detalhes-body").innerHTML = `<p style="color: var(--danger);">` + t("erro_carregar_detalhes") + `: ${err.message}</p>`;
    }
  }

  async function abrirModalChatInvestigador(denunciaId, codigo, token) {
    chatInvestigadorAtual = { id: Number(denunciaId), codigo: codigo };
    const modalHTML = `
      <div class="modal-overlay" id="modal-chat-inv-overlay" style="display:flex; z-index: 2000;">
        <div class="modal-content" style="max-width: 600px; height: 500px; display: flex; flex-direction: column;">
          <div class="modal-header">
            <h3 class="modal-title"><span data-i18n="chat_com_denunciante">Chat com Denunciante</span> <span style="font-size:0.8rem; color:var(--primary); margin-left:8px;">${codigo}</span></h3>
            <button class="modal-close" id="modal-chat-close-btn" type="button" aria-label="Fechar">✕</button>
          </div>
          <div class="chat-investigador-container" style="flex: 1; display: flex; flex-direction: column;">
            <div class="chat-investigador-messages" id="chat-inv-messages">
              <p style="text-align: center; color: var(--text-muted); margin-top: 20px;" data-i18n="carregando_mensagens">Carregando mensagens...</p>
            </div>
            <div class="chat-investigador-input" style="display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--border);">
              <input type="text" id="chat-inv-input" data-i18n-placeholder="placeholder_mensagem" placeholder="Escreva sua resposta..." style="flex: 1; padding: 10px 16px; border: 1px solid var(--border); border-radius: 20px; font-size: 0.9rem; outline: none;">
              <button id="modal-chat-send-btn" style="padding: 10px 20px; background: var(--primary); color: #fff; border: none; border-radius: 20px; cursor: pointer; font-weight: 600;" data-i18n="btn_enviar">Enviar</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    setTimeout(() => {
      const closeBtn = document.getElementById("modal-chat-close-btn");
      const sendBtn = document.getElementById("modal-chat-send-btn");
      const input = document.getElementById("chat-inv-input");
      if (closeBtn) closeBtn.addEventListener("click", () => { const modal = document.getElementById("modal-chat-inv-overlay"); if (modal) modal.remove(); });
      if (sendBtn) sendBtn.addEventListener("click", () => { window.enviarMensagemChatInvestigador(); });
      if (input) {
        input.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); window.enviarMensagemChatInvestigador(); } });
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denuncia_id: Number(chatInvestigadorAtual.id), autor: "in", texto: texto, hora: hora })
      });
      if (!response.ok) throw new Error("Falha no servidor");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      showToast(t("erro_enviar_mensagem"));
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
          if (msg.autor === "system") { div.className = "chat-msg-inv system"; div.textContent = msg.texto; }
          else { div.className = `chat-msg-inv ${msg.autor === 'in' ? 'investigador' : 'denunciante'}`; div.innerHTML = `${msg.texto}<span class="hora-msg">${msg.hora || ''}</span>`; }
          messagesDiv.appendChild(div);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      } else {
        messagesDiv.innerHTML = `<p style="text-align: center; color: var(--text-muted);" data-i18n="nenhuma_mensagem">Nenhuma mensagem ainda. Seja o primeiro a responder.</p>`;
      }
    } catch (err) {
      messagesDiv.innerHTML = `<p style="text-align: center; color: var(--danger);" data-i18n="erro_carregar_chat">Erro ao carregar chat.</p>`;
    }
  }

  async function abrirModalTimeline(denunciaId, token) {
    const modalHTML = `
      <div class="modal-overlay" id="modal-timeline-overlay" style="display:flex; z-index: 2000;">
        <div class="modal-content modal-timeline" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title">${icon("clock", 20)} <span data-i18n="linha_do_tempo">Linha do Tempo</span></h3>            
            <button class="modal-close" id="modal-timeline-close" type="button" aria-label="Fechar">X</button>
          </div>
          <div class="modal-body" id="timeline-body" style="padding: 20px; max-height: 400px; overflow-y: auto;">
            <p style="text-align: center; color: var(--text-muted);" data-i18n="carregando_historico">Carregando histórico...</p>
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
        body.innerHTML = `<p style="text-align: center; color: var(--text-muted);" data-i18n="nenhum_evento">Nenhum evento registrado ainda.</p>`;
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
      document.getElementById("timeline-body").innerHTML = `<p style="color: var(--danger); text-align: center;">` + t("erro_carregar_timeline") + `: ${err.message}</p>`;
    }
  }

  function abrirModalEmergencia() {
    if (document.getElementById("emergencia-modal")) return;
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
        <svg class="emergencia-item-icone" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </a>`).join("");

    const modalHTML = `
      <div class="emergencia-modal" id="emergencia-modal">
        <div class="emergencia-modal-content">
          <div class="emergencia-modal-header">
            <h3 class="emergencia-modal-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span data-i18n="numeros_emergencia">Números de Emergência</span>
            </h3>
            <button class="emergencia-modal-close" id="emergencia-modal-close" type="button" aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="emergencia-modal-body">
            <div class="emergencia-aviso">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <strong data-i18n="ligue_apenas_emergencia">Ligue apenas em casos de emergência.</strong><br>
                <span data-i18n="chamadas_falsas_crime">Chamadas falsas são crime e podem resultar em multa ou prisão.</span>
              </div>
            </div>
            <div class="emergencia-lista">${listaHTML}</div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const modal = document.getElementById("emergencia-modal");
    const btnClose = document.getElementById("emergencia-modal-close");
    btnClose.addEventListener("click", fecharModalEmergencia);
    modal.addEventListener("click", (e) => { if (e.target.id === "emergencia-modal") fecharModalEmergencia(); });
    document.addEventListener("keydown", handleEscEmergencia);
  }

  function handleEscEmergencia(e) {
    if (e.key === "Escape") { fecharModalEmergencia(); document.removeEventListener("keydown", handleEscEmergencia); }
  }

  function fecharModalEmergencia() {
    const modal = document.getElementById("emergencia-modal");
    if (modal) {
      modal.classList.add("modal-closing");
      setTimeout(() => { if (modal.parentNode) modal.remove(); }, 200);
    }
    document.removeEventListener("keydown", handleEscEmergencia);
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

    // Aplica a tradução imediatamente após injetar o HTML
    const savedLang = localStorage.getItem('sentinela-lang') || 'pt';
    setLanguage(savedLang);

    requestAnimationFrame(() => {
      if (path === "mapa") initMapa();
      if (path === "denuncias") initDenuncia();
      if (path === "denuncia-enviada") initDenunciaEnviada();
      if (path === "acompanhar") initAcompanhar(params.get("codigo"));
      if (path === "login") initLogin();
      if (path === "painel") initPainel();
      if (path === "inicio") setTimeout(() => { initAlertasTempoReal(); }, 100);
      if (path === "dashboard") setTimeout(() => { initDashboard(); }, 300);
      if (path === "previsao") setTimeout(() => { initPrevisao(); }, 300);
    });
  }

  function initEmergencia() {
    if (document.getElementById("btn-emergencia-flutuante")) return;
    const btnHTML = `<button class="btn-emergencia-flutuante" id="btn-emergencia-flutuante" type="button" aria-label="Emergência" title="Números de emergência" style="position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#ef5a63;color:#fff;border:none;box-shadow:0 4px 12px rgba(239,90,99,0.4);cursor:pointer;z-index:999;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>`;
    document.body.insertAdjacentHTML("beforeend", btnHTML);
    document.getElementById("btn-emergencia-flutuante").addEventListener("click", abrirModalEmergencia);
  }

  function initAlertasTempoReal() {
    const alertas = $$(".mini-row--clickable");
    alertas.forEach((alerta) => {
      alerta.addEventListener("click", () => {
        const ocorrenciaId = Number(alerta.dataset.ocorrencia);
        window.location.hash = "#/mapa";
        setTimeout(() => {
          const DATA = window.SENTINELA_DATA;
          const map = window.__sentinelaMap;
          if (map && DATA) {
            const ocorrencia = DATA.ocorrencias.find((o) => o.id === ocorrenciaId);
            if (ocorrencia) {
              map.panTo({ lat: ocorrencia.lat, lng: ocorrencia.lng });
              map.setZoom(16);
              const marker = mapMarkers.find((m) => m._occId === ocorrenciaId);
              if (marker) {
                setTimeout(() => { google.maps.event.trigger(marker, "click"); }, 300);
              }
            }
          }
        }, 300);
      });
    });
  }

  function init() {
    initTheme();
    initMobileNav();
    initEmergencia();
    const initialLang = localStorage.getItem('sentinela-lang') || 'pt';
    setLanguage(initialLang);
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

  window.setLanguage = setLanguage;
})();