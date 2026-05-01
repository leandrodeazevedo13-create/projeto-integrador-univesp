const multer = require('multer');
const express = require('express');
const path = require('path');
const db = require('./src/models/db');

const app = express();

// AJUSTE DE PORTA: O Render exige que a porta seja dinâmica
const port = process.env.PORT || 3000;

// Configuração do Multer para salvar as fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Configurações do Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Permite que o navegador acesse as fotos na pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); 

// --- ROTAS DE PÁGINAS (HTML) ---

// Rota da página inicial (Formulário)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/index.html'));
});

// Rota da página do Administrador (Tabela)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/admin.html'));
});

// --- ROTAS DE DADOS (API) ---

// Rota para salvar uma nova ocorrência
app.post('/reportar', upload.single('foto'), async (req, res) => {
    const { descricao, latitude, longitude } = req.body;
    const foto_url = req.file ? req.file.filename : null;

    try {
        const sql = 'INSERT INTO ocorrencias (descricao, latitude, longitude, foto_url) VALUES (?, ?, ?, ?)';
        await db.query(sql, [descricao, latitude, longitude, foto_url]);
        
        res.send(`
            <h2>Ocorrência enviada com sucesso!</h2>
            <p>Obrigado por ajudar na zeladoria de Ubatuba.</p>
            <a href="/">Voltar ao início</a> | <a href="/admin">Ver Painel</a>
        `);
    } catch (error) {
        console.error('Erro ao salvar no banco:', error);
        res.status(500).send('Erro interno ao processar o seu relato.');
    }
});

// Rota API que o admin.html usa para listar os dados na tabela
app.get('/api/ocorrencias', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ocorrencias ORDER BY data_criacao DESC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ error: 'Erro ao carregar dados' });
    }
});

// AJUSTE DE INICIALIZAÇÃO: Necessário 0.0.0.0 para o Render aceitar conexões externas
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});