require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Erro ao parsear JSON: " + error.message));
      }
    });
    req.on("error", reject);
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

function verifyToken(req) {
  const authHeader = req.headers["authorization"];
  const urlParams = new URL(req.url, `http://localhost:${PORT}`).searchParams;
  const tokenParam = urlParams.get("token");

  const token = authHeader ? authHeader.split(" ")[1] : tokenParam;

  if (!token) return null;

  try {
    const JWT_SECRET = process.env.SESSION_SECRET;
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    });
    res.end();
    return;
  }

  if (pathname.startsWith("/api/")) {
    try {
      const { getDadosMapa, TipoOcorrencia, Ocorrencia, Denuncia, MensagemChat, Investigador, Confirmacao, Timeline } = require("./models/classes");

      if (pathname === "/api/config" && req.method === "GET") {
        sendJSON(res, 200, { googleMapsApiKey: process.env.API_GOOGLE || "" });
        return;
      }

      if (pathname === "/api/dados-mapa" && req.method === "GET") {
        const dados = await getDadosMapa();
        sendJSON(res, 200, dados);
        return;
      }

      if (pathname === "/api/tipos" && req.method === "GET") {
        const tipos = await TipoOcorrencia.getAll();
        sendJSON(res, 200, tipos);
        return;
      }

      if (pathname === "/api/ocorrencias" && req.method === "GET") {
        const ocorrencias = await Ocorrencia.getAll();
        sendJSON(res, 200, ocorrencias);
        return;
      }

      if (pathname === "/api/ocorrencias" && req.method === "POST") {
        const data = await getRequestBody(req);
        if (!data.tipo_id || !data.severidade_id || !data.titulo || !data.bairro || !data.descricao) {
          sendJSON(res, 400, { error: "Campos obrigatórios faltando" });
          return;
        }
        const id = await Ocorrencia.create(data);
        sendJSON(res, 201, { id, message: "Ocorrência criada com sucesso" });
        return;
      }

      if (pathname === "/api/denuncias" && req.method === "POST") {
        const data = await getRequestBody(req);
        let tipoId = data.tipo_id;
        if (typeof tipoId === 'string' && isNaN(tipoId)) {
          const tipos = await TipoOcorrencia.getAll();
          const tipoEncontrado = tipos.find(t => t.nome.toLowerCase() === tipoId.toLowerCase() || t.id.toString() === tipoId);
          if (tipoEncontrado) tipoId = tipoEncontrado.id;
          else { sendJSON(res, 400, { error: "Tipo de ocorrência inválido" }); return; }
        }
        if (!tipoId || !data.severidade_id || !data.bairro || !data.descricao) {
          sendJSON(res, 400, { error: "Campos obrigatórios: tipo_id, severidade_id, bairro, descricao" });
          return;
        }
        const codigo = "DNC-" + Math.floor(1000 + Math.random() * 9000);
        const id = await Denuncia.create({
          codigo_anonimo: codigo,
          tipo_id: Number(tipoId),
          severidade_id: data.severidade_id,
          bairro: data.bairro,
          quando_ocorreu: data.quando_ocorreu || null,
          descricao: data.descricao
        });

        await Timeline.registrar({
          denuncia_id: id,
          evento: "Denúncia registrada",
          autor: "Sistema"
        });

        sendJSON(res, 201, { id, codigo, message: "Denúncia criada com sucesso" });
        return;
      }

      if (pathname.startsWith("/api/denuncias/") && req.method === "GET") {
        const codigo = pathname.split("/")[3];
        const denuncia = await Denuncia.getByCodigo(codigo);
        if (!denuncia) { sendJSON(res, 404, { error: "Denúncia não encontrada" }); return; }
        sendJSON(res, 200, denuncia);
        return;
      }

      if (pathname.startsWith("/api/chat-by-codigo/") && req.method === "GET") {
        const codigoRaw = pathname.split("/")[3];
        const codigo = decodeURIComponent(codigoRaw);
        const denuncia = await Denuncia.getByCodigo(codigo);
        if (!denuncia) {
          sendJSON(res, 404, { error: "Denúncia não encontrada", codigo: codigo });
          return;
        }
        const mensagens = await MensagemChat.getByDenunciaId(denuncia.id);
        sendJSON(res, 200, {
          denuncia: {
            id: denuncia.id,
            codigo: denuncia.codigo_anonimo,
            tipo: denuncia.tipo_nome,
            bairro: denuncia.bairro,
            status: denuncia.status
          },
          mensagens
        });
        return;
      }

      if (pathname === "/api/chat-mensagem" && req.method === "POST") {
        const data = await getRequestBody(req);
        const { denuncia_id, autor, texto, hora } = data;
        const msgId = await MensagemChat.create({
          denuncia_id,
          autor,
          texto,
          hora: hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          nome_remetente: autor === 'out' ? 'Denunciante' : 'Investigador'
        });

        if (autor === 'in') {
          await Timeline.registrar({
            denuncia_id: denuncia_id,
            evento: "Mensagem enviada pelo investigador",
            autor: "Investigador"
          });
        } else {
          await Timeline.registrar({
            denuncia_id: denuncia_id,
            evento: "Nova mensagem do denunciante",
            autor: "Denunciante"
          });
        }

        let resposta = null;
        if (autor === 'out') {
          const respostasAuto = [
            "Obrigado pela informação. Vamos registrar isso no processo.",
            "Anotado. Isso ajuda bastante na apuração.",
            "Perfeito. Nossa equipe vai verificar o local com discrição.",
            "Recebido. Se lembrar de mais detalhes, pode enviar por aqui a qualquer momento.",
            "Certo. Sua colaboração é fundamental e totalmente sigilosa."
          ];
          const respostaTexto = respostasAuto[Math.floor(Math.random() * respostasAuto.length)];
          const respostaHora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          await MensagemChat.create({
            denuncia_id,
            autor: 'in',
            texto: respostaTexto,
            hora: respostaHora,
            nome_remetente: 'Investigador'
          });
          resposta = { autor: 'in', texto: respostaTexto, hora: respostaHora };
        }
        sendJSON(res, 201, {
          mensagem: { id: msgId, autor, texto, hora },
          resposta: resposta
        });
        return;
      }

      if (pathname.startsWith("/api/chat/") && req.method === "GET") {
        const denunciaId = pathname.split("/")[3];
        const mensagens = await MensagemChat.getByDenunciaId(denunciaId);
        sendJSON(res, 200, mensagens);
        return;
      }

      if (pathname === "/api/chat" && req.method === "POST") {
        const data = await getRequestBody(req);
        const id = await MensagemChat.create(data);
        sendJSON(res, 201, { id, message: "Mensagem enviada" });
        return;
      }

      if (pathname === "/api/auth/login" && req.method === "POST") {
        const data = await getRequestBody(req);
        const { email, senha } = data;
        if (!email || !senha) {
          sendJSON(res, 400, { error: "Email e senha são obrigatórios" });
          return;
        }
        const investigador = await Investigador.getByEmail(email);
        if (!investigador) {
          sendJSON(res, 401, { error: "Credenciais inválidas" });
          return;
        }
        const senhaValida = await bcrypt.compare(senha, investigador.senha);
        if (!senhaValida) {
          sendJSON(res, 401, { error: "Credenciais inválidas" });
          return;
        }
        await Investigador.updateUltimoAcesso(investigador.id);
        const JWT_SECRET = process.env.SESSION_SECRET || "sentinela-secret-key-2026";
        const token = jwt.sign(
          { id: investigador.id, nome: investigador.nome, cargo: investigador.cargo },
          JWT_SECRET,
          { expiresIn: "8h" }
        );
        sendJSON(res, 200, {
          message: "Login realizado com sucesso",
          token: token,
          investigador: {
            id: investigador.id,
            nome: investigador.nome,
            email: investigador.email,
            cargo: investigador.cargo
          }
        });
        return;
      }

      if (pathname === "/api/auth/logout" && req.method === "POST") {
        sendJSON(res, 200, { message: "Logout realizado" });
        return;
      }

      if (pathname === "/api/auth/me" && req.method === "GET") {
        sendJSON(res, 200, { autenticado: false });
        return;
      }

      if (pathname === "/api/painel/denuncias" && req.method === "GET") {
        const user = verifyToken(req);
        if (!user) {
          sendJSON(res, 401, { error: "Não autorizado" });
          return;
        }
        const pool = require("./config/conexao");
        const result = await pool.query(`
          SELECT d.*, t.nome as tipo_nome, s.nome as severidade_nome
          FROM denuncias d
          JOIN tipos_ocorrencia t ON d.tipo_id = t.id
          JOIN severidades s ON d.severidade_id = s.id
          ORDER BY d.created_at DESC
        `);
        sendJSON(res, 200, result.rows);
        return;
      }

      if (pathname.startsWith("/api/painel/denuncias/") && req.method === "PUT") {
        const user = verifyToken(req);
        if (!user) {
          sendJSON(res, 401, { error: "Não autorizado" });
          return;
        }
        const id = pathname.split("/")[4];
        const data = await getRequestBody(req);
        if (data.status) {
          await Denuncia.updateStatus(id, data.status);

          const statusMensagens = {
            'aberta': 'Status alterado para: Aberta',
            'em_analise': 'Status alterado para: Em Análise',
            'resolvida': 'Status alterado para: Resolvida',
            'arquivada': 'Status alterado para: Arquivada'
          };

          const evento = statusMensagens[data.status] || `Status alterado para: ${data.status}`;

          await Timeline.registrar({
            denuncia_id: id,
            evento: evento,
            autor: user.nome || user.email || 'Investigador'
          });

          sendJSON(res, 200, { message: "Status atualizado" });
        } else {
          sendJSON(res, 400, { error: "Status inválido" });
        }
        return;
      }

      if (pathname === "/api/dashboard" && req.method === "GET") {
        const conexao = require("./config/conexao");
        const db = conexao.promise();
        const [tipos] = await db.query("SELECT t.nome, COUNT(o.id) as total FROM ocorrencias o JOIN tipos_ocorrencia t ON o.tipo_id = t.id GROUP BY t.id, t.nome");
        const [severidades] = await db.query("SELECT s.nome, s.cor, COUNT(o.id) as total FROM ocorrencias o JOIN severidades s ON o.severidade_id = s.id GROUP BY s.id, s.nome, s.cor");
        const [bairros] = await db.query("SELECT bairro, COUNT(id) as total FROM ocorrencias GROUP BY bairro ORDER BY total DESC LIMIT 5");
        const [timeline] = await db.query("SELECT DATE(created_at) as dia, COUNT(id) as total FROM ocorrencias WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY dia ASC");
        sendJSON(res, 200, { tipos, severidades, bairros, timeline });
        return;
      }

      // if (pathname === "/api/dashboard" && req.method === "GET") {
      //   const pool = require("./config/conexao");

      //   const tiposResult = await pool.query("SELECT t.nome, COUNT(o.id) as total FROM ocorrencias o JOIN tipos_ocorrencia t ON o.tipo_id = t.id GROUP BY t.id, t.nome");
      //   const severidadesResult = await pool.query("SELECT s.nome, s.cor, COUNT(o.id) as total FROM ocorrencias o JOIN severidades s ON o.severidade_id = s.id GROUP BY s.id, s.nome, s.cor");
      //   const bairrosResult = await pool.query("SELECT bairro, COUNT(id) as total FROM ocorrencias GROUP BY bairro ORDER BY total DESC LIMIT 5");
      //   const timelineResult = await pool.query("SELECT DATE(created_at) as dia, COUNT(id) as total FROM ocorrencias WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY dia ASC");

      //   sendJSON(res, 200, { 
      //     tipos: tiposResult.rows, 
      //     severidades: severidadesResult.rows, 
      //     bairros: bairrosResult.rows, 
      //     timeline: timelineResult.rows 
      //   });
      //   return;
      // }

      // if (pathname === "/api/tendencias" && req.method === "GET") {
      //   const pool = require("./config/conexao");

      //   const result = await pool.query(`
      //     SELECT 
      //       t.nome as tipo_nome,
      //       SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as atual,
      //       SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '14 days' AND o.created_at < NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as anterior
      //     FROM tipos_ocorrencia t
      //     LEFT JOIN ocorrencias o ON t.id = o.tipo_id
      //     GROUP BY t.id, t.nome
      //     ORDER BY atual DESC
      //   `);

      //   const tendencias = result.rows.map(r => {
      //     let variacao = 0;
      //     let status = "estavel";

      //     if (r.anterior > 0) {
      //       variacao = (((r.atual - r.anterior) / r.anterior) * 100).toFixed(0);
      //       if (variacao > 0) status = "alta";
      //       else if (variacao < 0) status = "baixa";
      //     } else if (r.atual > 0) {
      //       variacao = 100;
      //       status = "alta";
      //     }

      //     return {
      //       tipo: r.tipo_nome,
      //       atual: parseInt(r.atual),
      //       variacao: Math.abs(variacao),
      //       status: status
      //     };
      //   });

      //   sendJSON(res, 200, tendencias);
      //   return;
      // }

      // if (pathname === "/api/tendencias" && req.method === "GET") {
      //   const conexao = require("./config/conexao");
      //   const db = conexao.promise();

      //   const [rows] = await db.query(`
      //     SELECT 
      //       t.nome as tipo_nome,
      //       SUM(CASE WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as atual,
      //       SUM(CASE WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND o.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as anterior
      //     FROM tipos_ocorrencia t
      //     LEFT JOIN ocorrencias o ON t.id = o.tipo_id
      //     GROUP BY t.id, t.nome
      //     ORDER BY atual DESC
      //   `);

      //   const tendencias = rows.map(r => {
      //     let variacao = 0;
      //     let status = "estavel";

      //     if (r.anterior > 0) {
      //       variacao = (((r.atual - r.anterior) / r.anterior) * 100).toFixed(0);
      //       if (variacao > 0) status = "alta";
      //       else if (variacao < 0) status = "baixa";
      //     } else if (r.atual > 0) {
      //       variacao = 100;
      //       status = "alta";
      //     }

      //     return {
      //       tipo: r.tipo_nome,
      //       atual: r.atual,
      //       variacao: Math.abs(variacao),
      //       status: status
      //     };
      //   });

      //   sendJSON(res, 200, tendencias);
      //   return;
      // }

      if (pathname === "/api/painel/previsao" && req.method === "GET") {
        const user = verifyToken(req);
        if (!user) {
          sendJSON(res, 401, { error: "Não autorizado" });
          return;
        }

        const conexao = require("./config/conexao");
        const db = conexao.promise();

        const [dadosHistoricos] = await db.query(`
          SELECT 
            DAYOFWEEK(o.created_at) as dia_semana,
            FLOOR(HOUR(o.created_at) / 6) as faixa_horaria,
            o.bairro,
            o.tipo_id,
            t.nome as tipo_nome,
            COUNT(*) as total
          FROM ocorrencias o
          JOIN tipos_ocorrencia t ON o.tipo_id = t.id
          WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY dia_semana, faixa_horaria, bairro, o.tipo_id, t.nome
        `);

        const diaHoje = new Date().getDay();
        const horaAtual = new Date().getHours();
        const faixaAtual = Math.floor(horaAtual / 6);

        const totalOcorrencias = dadosHistoricos.reduce((sum, d) => sum + d.total, 0);
        const mediaGeral = dadosHistoricos.length > 0 ? totalOcorrencias / dadosHistoricos.length : 0;

        const grupos = {};
        dadosHistoricos.forEach(d => {
          const chave = `${d.dia_semana}-${d.faixa_horaria}-${d.bairro}-${d.tipo_id}`;
          if (!grupos[chave]) {
            grupos[chave] = {
              dia_semana: d.dia_semana,
              faixa_horaria: d.faixa_horaria,
              bairro: d.bairro,
              tipo_id: d.tipo_id,
              tipo_nome: d.tipo_nome,
              valores: []
            };
          }
          grupos[chave].valores.push(d.total);
        });

        const previsoes = [];
        Object.values(grupos).forEach(g => {
          const n = g.valores.length;
          const media = g.valores.reduce((a, b) => a + b, 0) / n;
          const variancia = g.valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / n;
          const desvio = Math.sqrt(variancia);

          let percentual = 0;
          let risco = "baixo";

          if (mediaGeral > 0) {
            percentual = ((media - mediaGeral) / mediaGeral) * 100;

            if (percentual > 100) risco = "critico";
            else if (percentual > 50) risco = "elevado";
            else if (percentual > 20) risco = "moderado";
            else risco = "baixo";
          }

          if (n >= 1 && media > 0) {
            previsoes.push({
              dia_semana: g.dia_semana,
              faixa_horaria: g.faixa_horaria,
              bairro: g.bairro,
              tipo_nome: g.tipo_nome,
              media_ocorrencias: Math.round(media * 10) / 10,
              desvio: Math.round(desvio * 10) / 10,
              percentual_acima: Math.round(percentual),
              risco: risco,
              amostras: n
            });
          }
        });

        const ordemRisco = { critico: 0, elevado: 1, moderado: 2, baixo: 3 };
        previsoes.sort((a, b) => {
          if (ordemRisco[a.risco] !== ordemRisco[b.risco]) {
            return ordemRisco[a.risco] - ordemRisco[b.risco];
          }
          return b.media_ocorrencias - a.media_ocorrencias;
        });

        sendJSON(res, 200, {
          previsoes: previsoes.slice(0, 20),
          dia_atual: diaHoje,
          faixa_atual: faixaAtual,
          hora_atual: horaAtual,
          total_grupos: previsoes.length,
          media_geral: Math.round(mediaGeral * 10) / 10
        });
        return;
      }

      if (pathname === "/api/painel/previsao" && req.method === "GET") {
        const user = verifyToken(req);
        if (!user) {
          sendJSON(res, 401, { error: "Não autorizado" });
          return;
        }

        const pool = require("./config/conexao");

        const result = await pool.query(`
          SELECT 
            EXTRACT(DOW FROM o.created_at) as dia_semana,
            FLOOR(EXTRACT(HOUR FROM o.created_at) / 6) as faixa_horaria,
            o.bairro,
            o.tipo_id,
            t.nome as tipo_nome,
            COUNT(*) as total
          FROM ocorrencias o
          JOIN tipos_ocorrencia t ON o.tipo_id = t.id
          WHERE o.created_at >= NOW() - INTERVAL '30 days'
          GROUP BY dia_semana, faixa_horaria, bairro, o.tipo_id, t.nome
        `);

        const dadosHistoricos = result.rows;

        const diaHoje = new Date().getDay();
        const horaAtual = new Date().getHours();
        const faixaAtual = Math.floor(horaAtual / 6);

        const totalOcorrencias = dadosHistoricos.reduce((sum, d) => sum + parseInt(d.total), 0);
        const mediaGeral = dadosHistoricos.length > 0 ? totalOcorrencias / dadosHistoricos.length : 0;

        const grupos = {};
        dadosHistoricos.forEach(d => {
          const chave = `${d.dia_semana}-${d.faixa_horaria}-${d.bairro}-${d.tipo_id}`;
          if (!grupos[chave]) {
            grupos[chave] = {
              dia_semana: parseInt(d.dia_semana),
              faixa_horaria: parseInt(d.faixa_horaria),
              bairro: d.bairro,
              tipo_id: parseInt(d.tipo_id),
              tipo_nome: d.tipo_nome,
              valores: []
            };
          }
          grupos[chave].valores.push(parseInt(d.total));
        });

        const previsoes = [];
        Object.values(grupos).forEach(g => {
          const n = g.valores.length;
          const media = g.valores.reduce((a, b) => a + b, 0) / n;
          const variancia = g.valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / n;
          const desvio = Math.sqrt(variancia);

          let percentual = 0;
          let risco = "baixo";

          if (mediaGeral > 0) {
            percentual = ((media - mediaGeral) / mediaGeral) * 100;

            if (percentual > 100) risco = "critico";
            else if (percentual > 50) risco = "elevado";
            else if (percentual > 20) risco = "moderado";
            else risco = "baixo";
          }

          if (n >= 1 && media > 0) {
            previsoes.push({
              dia_semana: g.dia_semana,
              faixa_horaria: g.faixa_horaria,
              bairro: g.bairro,
              tipo_nome: g.tipo_nome,
              media_ocorrencias: Math.round(media * 10) / 10,
              desvio: Math.round(desvio * 10) / 10,
              percentual_acima: Math.round(percentual),
              risco: risco,
              amostras: n
            });
          }
        });

        const ordemRisco = { critico: 0, elevado: 1, moderado: 2, baixo: 3 };
        previsoes.sort((a, b) => {
          if (ordemRisco[a.risco] !== ordemRisco[b.risco]) {
            return ordemRisco[a.risco] - ordemRisco[b.risco];
          }
          return b.media_ocorrencias - a.media_ocorrencias;
        });

        sendJSON(res, 200, {
          previsoes: previsoes.slice(0, 20),
          dia_atual: diaHoje,
          faixa_atual: faixaAtual,
          hora_atual: horaAtual,
          total_grupos: previsoes.length,
          media_geral: Math.round(mediaGeral * 10) / 10
        });
        return;
      }

      if (pathname === "/api/painel/relatorio/csv" && req.method === "GET") {
        const user = verifyToken(req);
        if (!user) {
          sendJSON(res, 401, { error: "Não autorizado" });
          return;
        }

        const pool = require("./config/conexao");

        const result = await pool.query(`
          SELECT o.id, o.titulo, o.bairro, o.tempo, o.descricao, 
                 t.nome as tipo, s.nome as severidade, o.created_at
          FROM ocorrencias o
          JOIN tipos_ocorrencia t ON o.tipo_id = t.id
          JOIN severidades s ON o.severidade_id = s.id
          ORDER BY o.created_at DESC
          LIMIT 100
        `);

        const ocorrencias = result.rows;

        const BOM = '\uFEFF';
        let csv = BOM + "ID,Título,Bairro,Tempo,Descrição,Tipo,Severidade,Data\n";

        ocorrencias.forEach(o => {
          const descricao = o.descricao ? o.descricao.replace(/"/g, '""') : '';
          const data = new Date(o.created_at).toLocaleDateString('pt-BR');
          csv += `${o.id},"${o.titulo}","${o.bairro}","${o.tempo}","${descricao}","${o.tipo}","${o.severidade}","${data}"\n`;
        });

        res.writeHead(200, {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=ocorrencias.csv"
        });
        res.end(csv);
        return;
      }

      if (pathname === "/api/painel/relatorio/pdf" && req.method === "GET") {
        const user = verifyToken(req);
        if (!user) {
          sendJSON(res, 401, { error: "Não autorizado" });
          return;
        }

        const PDFDocument = require("pdfkit");
        const doc = new PDFDocument();

        const pool = require("./config/conexao");

        const ocorrenciasResult = await pool.query(`
          SELECT o.titulo, o.bairro, t.nome as tipo, s.nome as severidade, o.created_at
          FROM ocorrencias o
          JOIN tipos_ocorrencia t ON o.tipo_id = t.id
          JOIN severidades s ON o.severidade_id = s.id
          ORDER BY o.created_at DESC
          LIMIT 50
        `);

        const statsResult = await pool.query(`
          SELECT COUNT(*) as total,
                 SUM(CASE WHEN s.id = 'alto' THEN 1 ELSE 0 END) as alto,
                 SUM(CASE WHEN s.id = 'medio' THEN 1 ELSE 0 END) as medio,
                 SUM(CASE WHEN s.id = 'baixo' THEN 1 ELSE 0 END) as baixo
          FROM ocorrencias o
          JOIN severidades s ON o.severidade_id = s.id
        `);

        const ocorrencias = ocorrenciasResult.rows;
        const stats = statsResult.rows;

        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=relatorio_sentinela.pdf"
        });

        doc.pipe(res);

        doc.fontSize(20).text("Sentinela - Relatório de Ocorrências", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: "center" });
        doc.moveDown(2);

        doc.fontSize(16).text("Resumo Estatístico", { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total de ocorrências: ${stats[0].total}`);
        doc.text(`Risco Alto: ${stats[0].alto || 0}`);
        doc.text(`Risco Médio: ${stats[0].medio || 0}`);
        doc.text(`Risco Baixo: ${stats[0].baixo || 0}`);
        doc.moveDown(2);

        doc.fontSize(16).text("Ocorrências Recentes", { underline: true });
        doc.moveDown();
        doc.fontSize(10);

        ocorrencias.forEach((o, index) => {
          const data = new Date(o.created_at).toLocaleString('pt-BR');
          doc.text(`${index + 1}. ${o.titulo}`);
          doc.text(`   Bairro: ${o.bairro} | Tipo: ${o.tipo} | Severidade: ${o.severidade}`);
          doc.text(`   Data: ${data}`, { color: "grey" });
          doc.moveDown();
        });

        doc.end();
        return;
      }

      if (pathname.startsWith("/api/timeline/") && req.method === "GET") {
        console.log("Rota timeline acessada:", pathname);

        const user = verifyToken(req);
        if (!user) {
          console.log("Usuário não autorizado");
          sendJSON(res, 401, { error: "Não autorizado" });
          return;
        }

        const denunciaId = pathname.split("/")[3];
        console.log("Buscando timeline para denúncia ID:", denunciaId);

        try {
          const eventos = await Timeline.getByDenunciaId(denunciaId);
          console.log("Eventos encontrados:", eventos.length);
          sendJSON(res, 200, eventos);
        } catch (error) {
          console.error("Erro ao buscar timeline:", error);
          sendJSON(res, 500, { error: "Erro ao buscar timeline", message: error.message });
        }
        return;
      }

      if (pathname === "/api/confirmacoes/stats" && req.method === "POST") {
        const data = await getRequestBody(req);
        const { ocorrencia_ids } = data;
        if (!Array.isArray(ocorrencia_ids)) {
          sendJSON(res, 400, { error: "Lista de IDs inválida" });
          return;
        }
        const stats = await Confirmacao.getEstatisticasMultiples(ocorrencia_ids);
        sendJSON(res, 200, stats);
        return;
      }

      if (pathname === "/api/confirmacoes" && req.method === "POST") {
        const data = await getRequestBody(req);
        const { ocorrencia_id, tipo_confirmacao, token_usuario } = data;
        if (!ocorrencia_id || !tipo_confirmacao || !token_usuario) {
          sendJSON(res, 400, { error: "Dados incompletos" });
          return;
        }
        if (!['confirmou', 'falsa'].includes(tipo_confirmacao)) {
          sendJSON(res, 400, { error: "Tipo de confirmação inválido" });
          return;
        }
        const resultado = await Confirmacao.registrar({
          ocorrencia_id,
          tipo_confirmacao,
          token_usuario
        });
        if (!resultado.sucesso) {
          sendJSON(res, 409, { error: resultado.mensagem });
          return;
        }
        const stats = await Confirmacao.getEstatisticas(ocorrencia_id);
        sendJSON(res, 201, {
          message: "Confirmação registrada",
          estatisticas: stats
        });
        return;
      }

      sendJSON(res, 404, { error: "Rota da API não encontrada", path: pathname, method: req.method });

    } catch (error) {
      console.error("Erro na API:", error);
      sendJSON(res, 500, {
        error: "Erro interno do servidor",
        message: error.message,
        path: pathname
      });
    }
    return;
  }

  let urlPath = decodeURIComponent(pathname.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  let filePath = path.join(ROOT, urlPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(ROOT, "index.html");
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 - Nao encontrado");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Servidor Sentinela rodando em http://localhost:${PORT}`);
});