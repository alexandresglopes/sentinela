const mysql = require("mysql2");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const conexao = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

conexao.connect((err) => {
    if (err) {
        console.error("Erro ao conectar ao MySQL:", err);
        return;
    }
    console.log("Conectado ao MySQL com sucesso!");
});

module.exports = conexao;

// const { Pool } = require("pg");
// const path = require("path");

// require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// const pool = new Pool({
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_DATABASE,
//     ssl: {
//         rejectUnauthorized: false 
//     }
// });

// module.exports = pool;