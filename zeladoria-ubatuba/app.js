const multer = require('multer');
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer'); // Importado para notificações
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

// Configuração do transportador de e-mail (Nodemailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Variável configurada no Render
    pass: process.env.EMAIL_PASS  // Senha de app configurada no Render
  }
});

// Configurações do Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (CSS, Imagens, JS do front-end)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); 

// --- ROTAS DE PÁGINAS (HTML) ---

app.get('/', (req, res) => {
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
        // 1. Salva no banco de dados da Aiven
        const sql = 'INSERT INTO ocorrencias (descricao, latitude, longitude, foto_url) VALUES (?, ?, ?, ?)';
        await db.query(sql, [descricao, latitude, longitude, foto_url]);
        
        // 2. Prepara e envia o e-mail de notificação
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, // Envia para o seu próprio e-mail
          subject: '🔔 Novo Relato de Zeladoria - Ubatuba',
          text: `Uma nova ocorrência foi registrada!\n\nDescrição: ${descricao}\nCoordenadas: ${latitude}, ${longitude}\nArquivo: ${foto_url}`
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error('Erro ao enviar e-mail:', err);
          } else {
            console.log('E-mail de notificação enviado:', info.response);
          }
        });

        // 3. Resposta de sucesso para o usuário
        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h2>Ocorrência enviada com sucesso!</h2>
                <p>Obrigado por ajudar na zeladoria de Ubatuba.</p>
                <hr>
                <a href="/">Voltar ao início</a> | <a href="/admin">Ver Painel</a>
            </div>
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
