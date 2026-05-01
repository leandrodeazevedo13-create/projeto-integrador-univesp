const multer = require('multer');
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer'); 
const db = require('./models/db'); 

const app = express();

// Porta dinâmica para o Render
const port = process.env.PORT || 3000;

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname.replace(/\s+/g, '-');
    cb(null, Date.now() + '-' + originalName);
  }
});

const upload = multer({ storage: storage });

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'))); 

// --- ROTAS DE PÁGINAS ---

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// --- ROTA DE POST CORRIGIDA ---

app.post('/reportar', upload.single('foto'), async (req, res) => {
    // Agora capturamos nome_usuario e tipo_ocorrencia vindos do formulário
    const { nome_usuario, tipo_ocorrencia, descricao, latitude, longitude } = req.body;
    const foto_url = req.file ? req.file.filename : null;

    try {
        // 1. Salva no banco incluindo as novas colunas
        const sql = `
            INSERT INTO ocorrencias 
            (nome_usuario, tipo_ocorrencia, descricao, latitude, longitude, foto_url) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(sql, [
            nome_usuario || 'Anônimo', 
            tipo_ocorrencia, 
            descricao, 
            latitude, 
            longitude, 
            foto_url
        ]);
        
        // 2. Notificação por e-mail com mais detalhes
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, 
          subject: `🔔 Novo Relato: ${tipo_ocorrencia}`,
          text: `Nova ocorrência em Ubatuba!\n\nEnviado por: ${nome_usuario || 'Anônimo'}\nTipo: ${tipo_ocorrencia}\nDescrição: ${descricao}\nCoordenadas: ${latitude}, ${longitude}\nFoto: ${foto_url}`
        };

        transporter.sendMail(mailOptions).catch(err => console.error('Erro e-mail:', err));

        // 3. Resposta de sucesso personalizada
        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #2c3e50;">
                <h2>✅ Ocorrência enviada com sucesso!</h2>
                <p>Obrigado pela contribuição, ${nome_usuario || 'cidadão'}.</p>
                <hr style="width: 50%; border: 0.5px solid #eee; margin: 20px auto;">
                <a href="/" style="text-decoration: none; color: #3498db; font-weight: bold;">Voltar ao início</a> | 
                <a href="/admin" style="text-decoration: none; color: #3498db;">Ver Painel Administrativo</a>
            </div>
        `);
    } catch (error) {
        console.error('Erro no banco:', error);
        res.status(500).send('Erro ao salvar no banco. Verifique se as colunas nome_usuario e tipo_ocorrencia foram criadas.');
    }
});

app.get('/api/ocorrencias', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ocorrencias ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error('Erro API:', error);
        res.status(500).json({ error: 'Erro ao carregar dados' });
    }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});