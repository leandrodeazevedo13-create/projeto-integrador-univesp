const multer = require('multer');
const express = require('express');
const path = require('path');
const db = require('./models/db'); 

const app = express();

// Porta dinâmica para o Render
const port = process.env.PORT || 3000;

// Configuração do Multer corrigida para arquivos na raiz
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Como app.js está na raiz, basta entrar em public/uploads/
    cb(null, path.join(__dirname, 'public/uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Configurações do Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (CSS, Imagens, JS do front-end)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); 

// --- ROTAS DE PÁGINAS (HTML) ---

app.get('/', (req, res) => {
  // Caminho corrigido: app.js está no mesmo nível da pasta views
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin.html'));
});

// --- ROTAS DE DADOS (API) ---

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

app.get('/api/ocorrencias', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ocorrencias ORDER BY data_criacao DESC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ error: 'Erro ao carregar dados' });
    }
});

// Inicialização para o Render
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});