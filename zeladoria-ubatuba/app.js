const multer = require('multer');
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer'); 
const db = require('./models/db'); 

const app = express();
const port = process.env.PORT || 10000; // Ajustado para porta do Render

// Configuração do Multer para salvar as fotos
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

// Configuração do Nodemailer (Mantida do seu código)
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

// --- ROTA DE POST (REPORTAR) ---
app.post('/reportar', upload.single('foto'), async (req, res) => {
    const { nome_usuario, tipo_ocorrencia, contato_feedback, descricao, latitude, longitude } = req.body;
    const foto_url = req.file ? req.file.filename : null;

    try {
        const sql = `
            INSERT INTO ocorrencias 
            (nome_usuario, tipo_ocorrencia, contato_feedback, descricao, latitude, longitude, foto_url, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendente')
        `;
        
        await db.query(sql, [
            nome_usuario || 'Anônimo', 
            tipo_ocorrencia, 
            contato_feedback || 'Não informado', 
            descricao, 
            latitude, 
            longitude, 
            foto_url
        ]);
        
        // Disparo de e-mail
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, 
          subject: `🔔 Novo Relato: ${tipo_ocorrencia}`,
          text: `Nova ocorrência em Ubatuba!\n\n Enviado por: ${nome_usuario || 'Anônimo'}\n Tipo: ${tipo_ocorrencia}\n Descrição: ${descricao}`
        };

        transporter.sendMail(mailOptions).catch(err => console.error('Erro e-mail:', err));

        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50_px;">
                <h2>✅ Ocorrência enviada com sucesso!</h2>
                <a href="/">Voltar ao início</a>
            </div>
        `);
    } catch (error) {
        console.error('Erro no banco:', error);
        res.status(500).send('Erro ao salvar no banco.');
    }
});

// --- API: BUSCAR DADOS ---
app.get('/api/ocorrencias', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ocorrencias ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar dados' });
    }
});

// --- API: ATUALIZAR STATUS ---
app.put('/api/ocorrencias/:id/status', async (req, res) => {
    const { id } = req.params;
    const { novoStatus } = req.body;
    try {
        await db.query('UPDATE ocorrencias SET status = ? WHERE id = ?', [novoStatus, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar' });
    }
});

// --- API: EXCLUIR OCORRÊNCIA ---
app.delete('/api/ocorrencias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM ocorrencias WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir' });
    }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});