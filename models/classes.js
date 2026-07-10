const pool = require("../config/conexao");

class TipoOcorrencia {
    static async getAll() {
        const result = await pool.query("SELECT id, nome FROM tipos_ocorrencia ORDER BY nome");
        return result.rows;
    }

    static async getById(id) {
        const result = await pool.query("SELECT * FROM tipos_ocorrencia WHERE id = $1", [id]);
        return result.rows[0];
    }
}

class Severidade {
    static async getAll() {
        const result = await pool.query("SELECT id, nome, cor FROM severidades ORDER BY id");
        return result.rows;
    }

    static async getById(id) {
        const result = await pool.query("SELECT * FROM severidades WHERE id = $1", [id]);
        return result.rows[0];
    }
}

class Ocorrencia {
    static async getAll() {
        const result = await pool.query(`
            SELECT o.*, t.nome as tipo_nome, s.nome as severidade_nome, s.cor as severidade_cor
            FROM ocorrencias o
            JOIN tipos_ocorrencia t ON o.tipo_id = t.id
            JOIN severidades s ON o.severidade_id = s.id
            ORDER BY o.created_at DESC
        `);
        return result.rows;
    }

    static async getById(id) {
        const result = await pool.query(`
            SELECT o.*, t.nome as tipo_nome, s.nome as severidade_nome, s.cor as severidade_cor
            FROM ocorrencias o
            JOIN tipos_ocorrencia t ON o.tipo_id = t.id
            JOIN severidades s ON o.severidade_id = s.id
            WHERE o.id = $1
        `, [id]);
        return result.rows[0];
    }

    static async create(data) {
        const { tipo_id, severidade_id, titulo, bairro, tempo, lat, lng, descricao } = data;
        const result = await pool.query(`
            INSERT INTO ocorrencias (tipo_id, severidade_id, titulo, bairro, tempo, lat, lng, descricao)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [tipo_id, severidade_id, titulo, bairro, tempo, lat, lng, descricao]);
        return result.rows[0].id;
    }

    static async delete(id) {
        const result = await pool.query("DELETE FROM ocorrencias WHERE id = $1", [id]);
        return result.rowCount;
    }
}

class Denuncia {
    static async getByCodigo(codigo) {
        const result = await pool.query(`
            SELECT d.*, t.nome as tipo_nome, s.nome as severidade_nome, s.cor as severidade_cor
            FROM denuncias d
            JOIN tipos_ocorrencia t ON d.tipo_id = t.id
            JOIN severidades s ON d.severidade_id = s.id
            WHERE d.codigo_anonimo = $1
        `, [codigo]);
        return result.rows[0];
    }

    static async create(data) {
        const { codigo_anonimo, tipo_id, severidade_id, bairro, quando_ocorreu, descricao } = data;
        const result = await pool.query(`
            INSERT INTO denuncias (codigo_anonimo, tipo_id, severidade_id, bairro, quando_ocorreu, descricao, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'aberta')
            RETURNING id
        `, [codigo_anonimo, tipo_id, severidade_id, bairro, quando_ocorreu, descricao]);
        return result.rows[0].id;
    }

    static async updateStatus(id, status) {
        const result = await pool.query("UPDATE denuncias SET status = $1 WHERE id = $2", [status, id]);
        return result.rowCount;
    }
}

class MensagemChat {
    static async getByDenunciaId(denunciaId) {
        const result = await pool.query(`
            SELECT * FROM mensagens_chat
            WHERE denuncia_id = $1
            ORDER BY created_at ASC
        `, [denunciaId]);
        return result.rows;
    }

    static async create(data) {
        const { denuncia_id, autor, texto, hora, nome_remetente } = data;
        const result = await pool.query(`
            INSERT INTO mensagens_chat (denuncia_id, autor, texto, hora, nome_remetente)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [denuncia_id, autor, texto, hora, nome_remetente]);
        return result.rows[0].id;
    }

    static async getMensagensIniciais(denunciaId) {
        const mensagensIniciais = [
            {
                denuncia_id: denunciaId,
                autor: 'system',
                texto: 'Canal seguro estabelecido. Sua identidade permanece protegida.',
                hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                nome_remetente: 'Sistema'
            },
            {
                denuncia_id: denunciaId,
                autor: 'in',
                texto: 'Olá. Recebemos sua denúncia. Pode confirmar o período em que a atividade costuma ocorrer?',
                hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                nome_remetente: 'Investigador'
            }
        ];

        for (const msg of mensagensIniciais) {
            await this.create(msg);
        }

        return mensagensIniciais;
    }
}

class Investigador {
    static async getByEmail(email) {
        const result = await pool.query(
            "SELECT * FROM investigadores WHERE email = $1 AND ativo = true",
            [email]
        );
        return result.rows[0];
    }

    static async getById(id) {
        const result = await pool.query(
            "SELECT id, nome, email, cargo, ultimo_acesso FROM investigadores WHERE id = $1",
            [id]
        );
        return result.rows[0];
    }

    static async updateUltimoAcesso(id) {
        await pool.query(
            "UPDATE investigadores SET ultimo_acesso = NOW() WHERE id = $1",
            [id]
        );
    }

    static async getAll() {
        const result = await pool.query(
            "SELECT id, nome, email, cargo, ativo, ultimo_acesso FROM investigadores ORDER BY nome"
        );
        return result.rows;
    }

    static async create(data) {
        const { nome, email, senha_hash, cargo } = data;
        const result = await pool.query(
            "INSERT INTO investigadores (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id",
            [nome, email, senha_hash, cargo || 'Investigador']
        );
        return result.rows[0].id;
    }

    static async toggleAtivo(id) {
        const result = await pool.query(
            "UPDATE investigadores SET ativo = NOT ativo WHERE id = $1",
            [id]
        );
        return result.rowCount;
    }
}

class Confirmacao {
    static async getEstatisticas(ocorrenciaId) {
        const result = await pool.query(`
            SELECT 
                SUM(CASE WHEN tipo_confirmacao = 'confirmou' THEN 1 ELSE 0 END) as total_confirmou,
                SUM(CASE WHEN tipo_confirmacao = 'falsa' THEN 1 ELSE 0 END) as total_falsa
            FROM confirmacoes_ocorrencias
            WHERE ocorrencia_id = $1
        `, [ocorrenciaId]);
        return result.rows[0];
    }

    static async registrar(data) {
        const { ocorrencia_id, tipo_confirmacao, token_usuario } = data;

        const existe = await pool.query(
            "SELECT id FROM confirmacoes_ocorrencias WHERE ocorrencia_id = $1 AND token_usuario = $2",
            [ocorrencia_id, token_usuario]
        );

        if (existe.rows.length > 0) {
            return { sucesso: false, mensagem: "Você já registrou sua opinião sobre esta ocorrência" };
        }

        const result = await pool.query(
            "INSERT INTO confirmacoes_ocorrencias (ocorrencia_id, tipo_confirmacao, token_usuario) VALUES ($1, $2, $3) RETURNING id",
            [ocorrencia_id, tipo_confirmacao, token_usuario]
        );

        return { sucesso: true, id: result.rows[0].id };
    }

    static async getEstatisticasMultiples(ocorrenciaIds) {
        if (!ocorrenciaIds || ocorrenciaIds.length === 0) return {};

        const placeholders = ocorrenciaIds.map((_, index) => `$${index + 1}`).join(',');
        const result = await pool.query(`
            SELECT 
                ocorrencia_id,
                SUM(CASE WHEN tipo_confirmacao = 'confirmou' THEN 1 ELSE 0 END) as total_confirmou,
                SUM(CASE WHEN tipo_confirmacao = 'falsa' THEN 1 ELSE 0 END) as total_falsa
            FROM confirmacoes_ocorrencias
            WHERE ocorrencia_id IN (${placeholders})
            GROUP BY ocorrencia_id
        `, ocorrenciaIds);

        const resultado = {};
        result.rows.forEach(r => {
            resultado[r.ocorrencia_id] = {
                confirmou: parseInt(r.total_confirmou) || 0,
                falsa: parseInt(r.total_falsa) || 0
            };
        });
        return resultado;
    }
}

async function getDadosMapa() {
    const ocorrencias = await Ocorrencia.getAll();
    const tiposResult = await pool.query(`
        SELECT id, nome 
        FROM tipos_ocorrencia 
        ORDER BY nome
    `);
    const tiposRows = tiposResult.rows;
    const severidades = await Severidade.getAll();

    const ocorrenciasFormatadas = ocorrencias.map(o => ({
        id: o.id,
        tipo: o.tipo_id.toString(),
        severidade: o.severidade_id,
        titulo: o.titulo,
        bairro: o.bairro,
        tempo: o.tempo,
        lat: parseFloat(o.lat),
        lng: parseFloat(o.lng),
        desc: o.descricao
    }));

    const tiposFormatados = tiposRows.map(t => ({
        id: Number(t.id),
        nome: t.nome
    }));

    const severidadesFormatadas = {};
    severidades.forEach(s => {
        severidadesFormatadas[s.id] = {
            nome: s.nome,
            cor: s.cor
        };
    });

    return {
        center: [-22.909393426521433, -43.199624346537284],
        zoom: 13,
        tipos: tiposFormatados,
        severidades: severidadesFormatadas,
        ocorrencias: ocorrenciasFormatadas
    };
}

class Timeline {
    static async getByDenunciaId(denunciaId) {
        const result = await pool.query(
            "SELECT * FROM timeline WHERE denuncia_id = $1 ORDER BY created_at ASC",
            [denunciaId]
        );
        return result.rows;
    }

    static async registrar(data) {
        const { denuncia_id, evento, autor } = data;
        const result = await pool.query(
            "INSERT INTO timeline (denuncia_id, evento, autor) VALUES ($1, $2, $3) RETURNING id",
            [denuncia_id, evento, autor || 'Sistema']
        );
        return result.rows[0].id;
    }
}

module.exports = {
    TipoOcorrencia,
    Severidade,
    Ocorrencia,
    Denuncia,
    MensagemChat,
    Investigador,
    Confirmacao,
    Timeline,
    getDadosMapa
};