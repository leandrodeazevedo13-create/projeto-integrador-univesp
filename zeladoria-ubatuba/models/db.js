const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // AJUSTE 1: Garantir que a porta seja um número. 
    // Variáveis de ambiente vêm como String, e o mysql2 às vezes falha se não for Number.
    port: Number(process.env.DB_PORT), 
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
        // AJUSTE 2: Melhorar o log para você ver exatamente qual HOST e USER o sistema está tentando usar
        console.error("Erro ao conectar no banco de dados:");
        console.error("Usuário:", process.env.DB_USER);
        console.error("Host:", process.env.DB_HOST);
        console.error("Detalhe do Erro:", err.message);
    });

module.exports = pool;