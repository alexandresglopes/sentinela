
CREATE DATABASE IF NOT EXISTS sentinela CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sentinela;


CREATE TABLE tipos_ocorrencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE severidades (
    id VARCHAR(20) PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cor VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE ocorrencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_id INT NOT NULL,
    severidade_id VARCHAR(20) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    tempo VARCHAR(50) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_id) REFERENCES tipos_ocorrencia(id) ON DELETE CASCADE,
    FOREIGN KEY (severidade_id) REFERENCES severidades(id) ON DELETE CASCADE,
    INDEX idx_lat_lng (lat, lng),
    INDEX idx_tipo (tipo_id),
    INDEX idx_severidade (severidade_id)
);


CREATE TABLE denuncias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_anonimo VARCHAR(20) NOT NULL UNIQUE,
    tipo_id INT NOT NULL,
    severidade_id VARCHAR(20) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    quando_ocorreu DATETIME,
    descricao TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'aberta',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_id) REFERENCES tipos_ocorrencia(id) ON DELETE CASCADE,
    FOREIGN KEY (severidade_id) REFERENCES severidades(id) ON DELETE CASCADE,
    INDEX idx_codigo (codigo_anonimo),
    INDEX idx_status (status)
);


CREATE TABLE mensagens_chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    denuncia_id INT NOT NULL,
    autor VARCHAR(20) NOT NULL,
    texto TEXT NOT NULL,
    hora VARCHAR(10),
    nome_remetente VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (denuncia_id) REFERENCES denuncias(id) ON DELETE CASCADE,
    INDEX idx_denuncia (denuncia_id)
);


INSERT INTO tipos_ocorrencia (nome) VALUES
('Furto'),
('Roubo'),
('Vandalismo'),
('Iluminação precária'),
('Tráfico'),
('Perturbação');


INSERT INTO severidades (id, nome, cor) VALUES
('alto', 'Alto', '#ef5a63'),
('medio', 'Médio', '#f4a63b'),
('baixo', 'Baixo', '#17b8a6');


INSERT INTO ocorrencias (tipo_id, severidade_id, titulo, bairro, tempo, lat, lng, descricao) VALUES
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Roubo'), 'alto', 'Roubo a pedestre', 'Bela Vista', 'há 12 min', -23.5581, -46.6490, 'Abordagem com uso de arma próxima ao ponto de ônibus.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Furto'), 'medio', 'Furto de celular', 'República', 'há 34 min', -23.5432, -46.6420, 'Vítima teve o aparelho subtraído em via movimentada.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Vandalismo'), 'baixo', 'Pichação em fachada', 'Consolação', 'há 1 h', -23.5560, -46.6620, 'Danos ao patrimônio público em ponto comercial.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Iluminação precária'), 'medio', 'Poste apagado', 'Liberdade', 'há 2 h', -23.5590, -46.6350, 'Trecho sem iluminação favorecendo insegurança à noite.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Roubo'), 'alto', 'Roubo de veículo', 'Aclimação', 'há 2 h', -23.5720, -46.6310, 'Veículo levado por dois suspeitos em motocicleta.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Tráfico'), 'alto', 'Ponto de tráfico', 'Glicério', 'há 3 h', -23.5540, -46.6270, 'Movimentação suspeita relatada por moradores.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Perturbação'), 'baixo', 'Som alto na madrugada', 'Vila Mariana', 'há 4 h', -23.5890, -46.6340, 'Perturbação do sossego recorrente aos fins de semana.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Furto'), 'medio', 'Furto em comércio', 'Sé', 'há 5 h', -23.5500, -46.6340, 'Subtração de mercadorias em loja do centro.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Roubo'), 'alto', 'Assalto a transeunte', 'Bexiga', 'há 6 h', -23.5610, -46.6520, 'Vítima abordada ao sair de estabelecimento.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Vandalismo'), 'baixo', 'Lixeira depredada', 'Cambuci', 'há 7 h', -23.5680, -46.6230, 'Mobiliário urbano danificado.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Iluminação precária'), 'medio', 'Praça sem iluminação', 'Paraíso', 'há 8 h', -23.5760, -46.6440, 'Área de lazer às escuras aumenta sensação de risco.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Furto'), 'medio', 'Furto de bicicleta', 'Higienópolis', 'há 9 h', -23.5460, -46.6570, 'Bicicleta furtada de área externa de prédio.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Roubo'), 'alto', 'Roubo em transporte', 'Brás', 'há 10 h', -23.5430, -46.6160, 'Passageiros abordados dentro de coletivo.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Perturbação'), 'baixo', 'Aglomeração irregular', 'Santa Cecília', 'há 11 h', -23.5380, -46.6520, 'Ocupação indevida de via pública.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Tráfico'), 'alto', 'Denúncia de tráfico', 'Luz', 'há 12 h', -23.5340, -46.6360, 'Atividade suspeita em imóvel abandonado.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Furto'), 'medio', 'Furto de fios', 'Pari', 'há 13 h', -23.5290, -46.6180, 'Subtração de cabos de telecomunicação.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Vandalismo'), 'baixo', 'Vidro quebrado em abrigo', 'Barra Funda', 'há 14 h', -23.5260, -46.6650, 'Abrigo de ônibus danificado.'),
((SELECT id FROM tipos_ocorrencia WHERE nome = 'Roubo'), 'alto', 'Roubo a residência', 'Perdizes', 'há 15 h', -23.5370, -46.6720, 'Invasão relatada durante ausência dos moradores.');