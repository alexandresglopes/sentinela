
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

CREATE TABLE investigadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) DEFAULT 'Investigador',
    ativo TINYINT(1) DEFAULT 1,
    ultimo_acesso DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO investigadores (nome, email, senha, cargo) VALUES
('Administrador', 'admin@sentinela.com', '$2b$10$YourHashHere', 'Administrador');

CREATE TABLE `confirmacoes_ocorrencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ocorrencia_id` int NOT NULL,
  `tipo_confirmacao` enum('confirmou','falsa') COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_usuario` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_confirmacao` (`ocorrencia_id`,`token_usuario`),
  KEY `idx_ocorrencia` (`ocorrencia_id`),
  CONSTRAINT `confirmacoes_ocorrencias_ibfk_1` FOREIGN KEY (`ocorrencia_id`) REFERENCES `ocorrencias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    denuncia_id INT NOT NULL,
    evento VARCHAR(100) NOT NULL,
    autor VARCHAR(50) DEFAULT 'Sistema',
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


INSERT INTO `ocorrencias` VALUES (1,2,'alto','Roubo a pedestre','Bela Vista','há 12 min',-23.55810000,-46.64900000,'Abordagem com uso de arma próxima ao ponto de ônibus.','2026-07-05 02:19:10'),
(2,1,'medio','Furto de celular','República','há 34 min',-23.54320000,-46.64200000,'Vítima teve o aparelho subtraído em via movimentada.','2026-07-05 02:19:10'),
(3,3,'baixo','Pichação em fachada','Consolação','há 1 h',-23.55600000,-46.66200000,'Danos ao patrimônio público em ponto comercial.','2026-07-05 02:19:10'),
(4,4,'medio','Poste apagado','Liberdade','há 2 h',-23.55900000,-46.63500000,'Trecho sem iluminação favorecendo insegurança à noite.','2026-07-05 02:19:10'),
(5,2,'alto','Roubo de veículo','Aclimação','há 2 h',-23.57200000,-46.63100000,'Veículo levado por dois suspeitos em motocicleta.','2026-07-05 02:19:10'),
(6,5,'alto','Ponto de tráfico','Glicério','há 3 h',-23.55400000,-46.62700000,'Movimentação suspeita relatada por moradores.','2026-07-05 02:19:10'),
(7,6,'baixo','Som alto na madrugada','Vila Mariana','há 4 h',-23.58900000,-46.63400000,'Perturbação do sossego recorrente aos fins de semana.','2026-07-05 02:19:10'),
(8,1,'medio','Furto em comércio','Sé','há 5 h',-23.55000000,-46.63400000,'Subtração de mercadorias em loja do centro.','2026-07-05 02:19:10'),
(9,2,'alto','Assalto a transeunte','Bexiga','há 6 h',-23.56100000,-46.65200000,'Vítima abordada ao sair de estabelecimento.','2026-07-05 02:19:10'),
(10,3,'baixo','Lixeira depredada','Cambuci','há 7 h',-23.56800000,-46.62300000,'Mobiliário urbano danificado.','2026-07-05 02:19:10'),
(11,4,'medio','Praça sem iluminação','Paraíso','há 8 h',-23.57600000,-46.64400000,'Área de lazer às escuras aumenta sensação de risco.','2026-07-05 02:19:10'),
(12,1,'medio','Furto de bicicleta','Higienópolis','há 9 h',-23.54600000,-46.65700000,'Bicicleta furtada de área externa de prédio.','2026-07-05 02:19:10'),
(13,2,'alto','Roubo em transporte','Brás','há 10 h',-23.54300000,-46.61600000,'Passageiros abordados dentro de coletivo.','2026-07-05 02:19:10'),
(14,6,'baixo','Aglomeração irregular','Santa Cecília','há 11 h',-23.53800000,-46.65200000,'Ocupação indevida de via pública.','2026-07-05 02:19:10'),
(15,5,'alto','Denúncia de tráfico','Luz','há 12 h',-23.53400000,-46.63600000,'Atividade suspeita em imóvel abandonado.','2026-07-05 02:19:10'),
(16,1,'medio','Furto de fios','Pari','há 13 h',-23.52900000,-46.61800000,'Subtração de cabos de telecomunicação.','2026-07-05 02:19:10'),
(17,3,'baixo','Vidro quebrado em abrigo','Barra Funda','há 14 h',-23.52600000,-46.66500000,'Abrigo de ônibus danificado.','2026-07-05 02:19:10'),
(18,2,'alto','Roubo a residência','Perdizes','há 15 h',-23.53700000,-46.67200000,'Invasão relatada durante ausência dos moradores.','2026-07-05 02:19:10'),
(19,5,'medio','Nova ocorrência registrada','Local marcado','agora',-23.55227348,-46.68817038,'Ocorrência adicionada pelo cidadão.','2026-07-05 17:32:03'),
(20,1,'medio','Nova ocorrência registrada','Local marcado','agora',-23.53736632,-46.67464125,'Ocorrência adicionada pelo cidadão.','2026-07-05 18:40:50'),
(21,5,'alto','Tráfico registrada','vicente de carvalho','agora',-23.54016014,-46.64336370,'teste clique','2026-07-05 19:02:50'),
(22,2,'alto','Roubo a turista na praia','Copacabana','há 15 min',-22.97110000,-43.18220000,'Abordagem violenta próximo ao posto 6, levaram celular e corrente de ouro.','2026-07-05 20:16:35'),
(23,1,'medio','Furto de bicicleta na ciclovia','Ipanema','há 45 min',-22.98380000,-43.20960000,'Bicicleta presa em corrente foi cortada e levada durante a manhã.','2026-07-05 20:16:35'),
(24,6,'baixo','Briga e som alto em bar','Lapa','há 1 h',-22.91340000,-43.17880000,'Frequentadores de bar discutindo e som acima do permitido após as 2h da manhã.','2026-07-05 20:16:35'),
(25,3,'baixo','Pichação em monumento histórico','Centro','há 2 h',-22.90350000,-43.17420000,'Estátua na praça XV foi pichada durante a madrugada.','2026-07-05 20:16:35'),
(26,4,'medio','Rua escura próximo à escola','Tijuca','há 3 h',-22.92490000,-43.23210000,'Três postes queimados na rua onde fica a escola municipal, gerando insegurança.','2026-07-05 20:16:35'),
(27,5,'alto','Movimentação suspeita em viela','Botafogo','há 4 h',-22.95190000,-43.18250000,'Indivíduos armados fazendo pontos de venda em viela entre os prédios.','2026-07-05 20:16:35'),
(28,1,'medio','Furto de acessórios em carro','Flamengo','há 5 h',-22.93220000,-43.17560000,'Veículo estacionado na rua teve retrovisores e calotas furtados.','2026-07-05 20:16:35'),
(29,2,'alto','Assalto a transeunte no bondinho','Santa Teresa','há 6 h',-22.92110000,-43.18830000,'Turista foi rendido por dois assaltantes ao descer do bonde.','2026-07-05 20:16:35'),
(30,3,'baixo','Dano em praça pública','Barra da Tijuca','há 8 h',-23.00440000,-43.36470000,'Banco de praça e lixeiras foram destruídos por grupo de jovens.','2026-07-05 20:16:35'),
(31,6,'baixo','Aglomeração e barulho excessivo','Maracanã','há 10 h',-22.91210000,-43.23020000,'Festa irregular em residência próxima ao estádio com som automotivo alto.','2026-07-05 20:16:35'),
(32,6,'medio','Perturbação registrada','centro','agora',-22.90187790,-43.18416772,'teste','2026-07-06 14:45:08');
