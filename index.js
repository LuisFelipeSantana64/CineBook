const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    host: 'mysql-3f67d6d1-luisfelipesantana64-5ee9.h.aivencloud.com',
    port: 24871,
    user: 'avnadmin',              
    password: 'AVNS_27RQmimhjz4xT_Mdpe_', 
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados na nuvem:', err.message);
    } else {
        console.log('Conectado ao banco de dados MySQL na nuvem com sucesso!');
    }
});

// ROTA: Cadastro de Usuário
app.post('/api/auth/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;
    const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
    db.query(sql, [nome, email, senha], (err, result) => {
        if (err) {
            return res.status(400).json({ error: 'E-mail já cadastrado ou dados inválidos.' });
        }
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    });
});

// ROTA: Login de Usuário
app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    const sql = 'SELECT id, nome FROM usuarios WHERE email = ? AND senha = ?';
    db.query(sql, [email, senha], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }
        res.json({ user: results[0] });
    });
});

// ROTA: Listar Itens (Identificando o dono para mudar a cor no front)
app.get('/api/itens', (req, res) => {
    const usuarioLogadoId = req.headers['x-user-id'] || 0;
    const sql = 'SELECT * FROM itens';
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        
        // Mapeia adicionando um marcador booleano se o item pertence ao usuário atual
        const itensTratados = results.map(item => ({
            ...item,
            e_do_usuario: item.usuario_id == usuarioLogadoId
        }));
        res.json(itensTratados);
    });
});

// ROTA: Salvar Novo Item vinculado ao usuário
app.post('/salvar', (req, res) => {
    const { nome, categoria, descricao, preco_nota, usuario_id } = req.body;
    const sql = 'INSERT INTO itens (nome, categoria, descricao, preco_nota, usuario_id) VALUES (?, ?, ?, ?, ?)';
    
    db.query(sql, [nome, categoria, descricao, preco_nota, usuario_id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.redirect('/'); 
    });
});

// ROTA: Deletar Item
app.delete('/api/itens/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM itens WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Deletado com sucesso!' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando perfeitamente em http://localhost:${PORT}`);
});