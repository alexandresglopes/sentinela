async function carregarDados() {
  try {
    console.log("Buscando dados do banco...");
    const response = await fetch("/api/dados-mapa");
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const dados = await response.json();
    console.log("Dados recebidos da API:", dados);
    
    
    dados.chatInicial = [
      { autor: "system", texto: "Canal seguro estabelecido. Sua identidade permanece protegida.", hora: "09:02" },
      { autor: "in", texto: "Olá. Recebemos sua denúncia (código DNC-4821). Pode confirmar o período em que a atividade costuma ocorrer?", hora: "09:03", nome: "Investigador" },
      { autor: "out", texto: "Geralmente à noite, depois das 22h, durante a semana.", hora: "09:05" },
      { autor: "in", texto: "Entendido. Há veículos envolvidos ou algum ponto de referência próximo?", hora: "09:06", nome: "Investigador" },
    ];

    dados.respostasAuto = [
      "Obrigado pela informação. Vamos registrar isso no processo.",
      "Anotado. Isso ajuda bastante na apuração.",
      "Perfeito. Nossa equipe vai verificar o local com discrição.",
      "Recebido. Se lembrar de mais detalhes, pode enviar por aqui a qualquer momento.",
      "Certo. Sua colaboração é fundamental e totalmente sigilosa.",
    ];

   
    window.SENTINELA_DATA = dados;
    
    console.log("Dados carregados com sucesso:", {
      ocorrencias: dados.ocorrencias.length,
      tipos: dados.tipos.length,
      tiposIds: dados.tipos.map(t => t.id)
    });
    
    
    window.dispatchEvent(new Event("dadosCarregados"));
    
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    
    
    window.SENTINELA_DATA = {
      
      center: [-22.909393426521433, -43.199624346537284],
      zoom: 13,
      tipos: [],
      severidades: {
        alto: { nome: "Alto", cor: "#ef5a63" },
        medio: { nome: "Médio", cor: "#f4a63b" },
        baixo: { nome: "Baixo", cor: "#17b8a6" }
      },
      ocorrencias: [],
      chatInicial: [],
      respostasAuto: []
    };
    
    window.dispatchEvent(new Event("dadosCarregados"));
  }
}

carregarDados();