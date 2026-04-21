const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function criarBanco() {
    const db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });

    // Criando a tabela de ocorrências conforme seu projeto
    await db.exec(`
        CREATE TABLE IF NOT EXISTS ocorrencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT,
            latitude REAL,
            longitude REAL,
            status TEXT DEFAULT 'Pendente'
        )
    `);
    
    console.log("Banco de dados e tabela prontos!");
    return db;
}

module.exports = criarBanco;
