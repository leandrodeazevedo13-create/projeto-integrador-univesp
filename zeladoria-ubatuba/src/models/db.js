const mysql = require('mysql2');
require('dotenv').config(); // Carrega as configurações do seu arquivo .env

// Usando as variáveis de ambiente para maior segurança e flexibilidade
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307, 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', 
  database: process.env.DB_NAME || 'zeladoria_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Função para configurar a tabela automaticamente
async function setupDatabase() {
  try {
    // Cria a tabela se ela não existir. 
    // Mantemos os campos para o projeto da UNIVESP: descrição, localização e foto.
    const sql = `
      CREATE TABLE IF NOT EXISTS ocorrencias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        descricao TEXT,
        latitude VARCHAR(50),
        longitude VARCHAR(50),
        foto_url VARCHAR(255),
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await promisePool.query(sql);
    console.log('✅ Banco de dados pronto: Tabela "ocorrencias" verificada.');
    
  } catch (error) {
    console.error('❌ Erro ao configurar o banco de dados:', error);
  }
}

// Executa a configuração ao iniciar o servidor
setupDatabase();

module.exports = promisePool;