
require('dotenv').config();

const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));


const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ ERRO CRÍTICO: Não foi possível conectar ao Pool do Aiven!');
        console.error('Detalhes do erro:', err.message);
    } else {
        console.log('🚀 SUCESSO: O Node.js criou o Pool e está autenticado no Aiven!');
        connection.query('SELECT 1 + 1 AS teste', (testErr) => {
            connection.release();
            if (testErr) {
                console.error('❌ Erro ao testar comandos:', testErr.message);
            } else {
                console.log('✅ Banco de dados respondendo perfeitamente via Pool!');
            }
        });
    }
});

app.post('/api/auth/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;
    
    console.log("📥 Dados recebidos no servidor:", { nome, email, senha: senha ? "••••••••" : null });
    
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
    db.query(sql, [nome, email, senha], (err, result) => {
        if (err) {
            console.error("❌ Erro ao inserir usuário no banco:", err.message);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
            }
            return res.status(500).json({ error: 'Erro interno ao processar o cadastro.' });
        }
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const sql = 'SELECT id, nome FROM usuarios WHERE email = ? AND senha = ?';
    db.query(sql, [email, senha], (err, results) => {
        if (err) {
            console.error("❌ Erro ao buscar usuário no login:", err.message);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }
        res.json({ user: results[0] });
    });
});

app.get('/api/itens', (req, res) => {
    const usuarioLogadoId = req.headers['x-user-id'] || 0;
    
    const sql = `
        SELECT 
            itens.id, 
            itens.nome, 
            itens.categoria, 
            itens.descricao, 
            itens.preco_nota, 
            itens.usuario_id,
            usuarios.nome AS nome_usuario 
        FROM itens
        INNER JOIN usuarios ON itens.usuario_id = usuarios.id
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Erro ao listar itens:", err.message);
            return res.status(500).send(err);
        }
        const itensTratados = results.map(item => ({
            ...item,
            e_do_usuario: item.usuario_id == usuarioLogadoId
        }));
        res.json(itensTratados);
    });
});


app.post('/salvar', (req, res) => {
    const { nome, categoria, descricao, preco_nota, usuario_id } = req.body;
    if (!usuario_id) {
        return res.status(401).send("Usuário não identificado. Faça login novamente.");
    }
    const sql = 'INSERT INTO itens (nome, categoria, descricao, preco_nota, usuario_id) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [nome, categoria, descricao, preco_nota, usuario_id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao salvar novo item:", err.message);
            return res.status(500).send(err);
        }
        res.redirect('/'); 
    });
});

app.delete('/api/itens/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM itens WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao deletar item:", err.message);
            return res.status(500).send(err);
        }
        res.json({ message: 'Deletado com sucesso!' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando perfeitamente em http://localhost:${PORT}`);
});
