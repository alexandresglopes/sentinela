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
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    const JWT_SECRET = process.env.SESSION_SECRET || "sentinela-secret-key-2026";
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
      const { getDadosMapa, TipoOcorrencia, Ocorrencia, Denuncia, MensagemChat, Investigador, Confirmacao } = require("./models/classes");

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
        const conexao = require("./config/conexao");
        const conexaoPromise = conexao.promise();
        const [rows] = await conexaoPromise.query(`
          SELECT d.*, t.nome as tipo_nome, s.nome as severidade_nome
          FROM denuncias d
          JOIN tipos_ocorrencia t ON d.tipo_id = t.id
          JOIN severidades s ON d.severidade_id = s.id
          WHERE d.status IN ('aberta', 'em_analise')
          ORDER BY d.created_at DESC
        `);
        sendJSON(res, 200, rows);
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