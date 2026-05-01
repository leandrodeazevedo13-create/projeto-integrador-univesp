const mysql = require('mysql2/promise');

// Cria a conexão usando as variáveis de ambiente que você configurou no Render
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    // A linha abaixo é obrigatória para conectar ao MySQL da Aiven
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Testa a conexão ao iniciar
pool.getConnection()
    .then(conn => {
        console.log("Conectado ao banco de dados da Aiven com sucesso!");
        conn.release();
    })
    .catch(err => {
        console.error("Erro ao conectar no banco de dados:", err);
    });

module.exports = pool;