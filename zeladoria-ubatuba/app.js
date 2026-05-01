const multer = require('multer');
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer'); 
const db = require('./models/db'); // Certifique-se que db.js usa mysql2/promise

const app = express();

// Porta dinâmica para o Render (0.0.0.0 é importante para o deploy)
const port = process.env.PORT || 3000;

// Configuração do Multer: Garante que o caminho exista
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Caminho absoluto para evitar erros dependendo de onde o processo inicia
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Remove espaços do nome original para evitar links quebrados na URL
    const originalName = file.originalname.replace(/\s+/g, '-');
    cb(null, Date.now() + '-' + originalName);
  }
});

const upload = multer({ storage: storage });

// Configuração do Nodemailer usando as variáveis que você já configurou na Render
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

// Middlewares para processar dados de formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos corretamente
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'))); 

// --- ROTAS DE PÁGINAS (HTML) ---

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// --- ROTAS DE DADOS (API) ---

app.post('/reportar', upload.single('foto'), async (req, res) => {
    const { descricao, latitude, longitude } = req.body;
    const foto_url = req.file ? req.file.filename : null;

    try {
        // 1. Salva no banco de dados da Aiven (mysql-23c2c720...)
        const sql = 'INSERT INTO ocorrencias (descricao, latitude, longitude, foto_url) VALUES (?, ?, ?, ?)';
        await db.query(sql, [descricao, latitude, longitude, foto_url]);
        
        // 2. Notificação por e-mail
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, 
          subject: '🔔 Novo Relato de Zeladoria - Ubatuba',
          text: `Nova ocorrência!\n\nDescrição: ${descricao}\nCoordenadas: ${latitude}, ${longitude}\nFoto: ${foto_url}`
        };

        // Envio assíncrono para não travar a resposta do usuário
        transporter.sendMail(mailOptions).catch(err => console.error('Erro e-mail:', err));

        // 3. Resposta amigável para o morador de Ubatuba
        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h2 style="color: #2c3e50;">Ocorrência enviada com sucesso!</h2>
                <p>Obrigado por colaborar com a manutenção da nossa cidade.</p>
                <hr style="width: 50%; border: 0.5px solid #eee;">
                <a href="/" style="text-decoration: none; color: #3498db;">Voltar ao início</a> | 
                <a href="/admin" style="text-decoration: none; color: #3498db;">Ver Painel</a>
            </div>
        `);
    } catch (error) {
        console.error('Erro no banco:', error);
        res.status(500).send('Erro ao processar relato. Verifique a conexão com o banco.');
    }
});

app.get('/api/ocorrencias', async (req, res) => {
    try {
        // Busca os dados para o painel administrativo
        const [rows] = await db.query('SELECT * FROM ocorrencias ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error('Erro API:', error);
        res.status(500).json({ error: 'Erro ao carregar dados do banco' });
    }
});

// Inicialização focada no ambiente da Render
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor de Zeladoria rodando na porta ${port}`);
});