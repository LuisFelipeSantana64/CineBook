const path = require('path');
const express = require('express');
const mysql = require('mysql2'); // Mantém o mesmo require
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Garante que os arquivos da pasta public (HTML, CSS, JS) sejam servidos corretamente
app.use(express.static(path.join(__dirname, 'public')));

// MODIFICADO: Agora usando createPool para evitar conexões caídas/fechadas!
const db = mysql.createPool({
    host: 'mysql-3f67d6d1-luisfelipesantana64-5ee9.h.aivencloud.com',
    port: 24871,
    user: 'avnadmin',              
    password: 'AVNS_27RQmimhjz4xT_Mdpe_', 
    database: 'defaultdb',
    waitForConnections: true,    // Aguarda uma conexão liberar se o banco estiver cheio
    connectionLimit: 10,         // Limite de até 10 conexões simultâneas prontas para uso
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false // CRUCIAL para o Aiven aceitar conexões externas
    }
});

// TESTE REAL DE CONEXÃO COM O POOL
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ ERRO CRÍTICO: Não foi possível conectar ao Pool do Aiven!');
        console.error('Detalhes do erro:', err.message);
        console.error('Código do erro:', err.code);
    } else {
        console.log('🚀 SUCESSO: O Node.js criou o Pool e está autenticado no Aiven!');
        
        // Teste de comando usando a conexão ativa do Pool
        connection.query('SELECT 1 + 1 AS teste', (testErr) => {
            // Libera a conexão de volta para o pool após o teste
            connection.release(); 
            
            if (testErr) {
                console.error('❌ O banco conectou, mas falhou ao executar comandos:', testErr.message);
            } else {
                console.log('✅ Banco de dados respondendo a comandos via Pool perfeitamente!');
            }
        });
    }
});

// ==========================================================================
// ROTAS DA APLICAÇÃO (CINEBOOK TRACKER)
// ==========================================================================

// 1. ROTA: Cadastro de Usuário
app.post('/api/auth/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;
    
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
            return res.status(400).json({ error: 'Erro interno ao processar o cadastro.' });
        }
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    });
});

// 2. ROTA: Login de Usuário
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

// 3. ROTA: Listar Itens (Identifica se o item pertence ao usuário logado)
app.get('/api/itens', (req, res) => {
    // Captura o ID do usuário enviado pelo cabeçalho do Front-end
    const usuarioLogadoId = req.headers['x-user-id'] || 0;
    const sql = 'SELECT * FROM itens';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Erro ao listar itens do banco:", err.message);
            return res.status(500).send(err);
        }
        
        // Mapeia os dados acrescentando a flag true/false caso pertença ao usuário atual
        const itensTratados = results.map(item => ({
            ...item,
            e_do_usuario: item.usuario_id == usuarioLogadoId
        }));
        
        res.json(itensTratados);
    });
});

// 4. ROTA: Salvar Novo Item (Filme/Livro) vinculado ao criador
app.post('/salvar', (req, res) => {
    const { nome, categoria, descricao, preco_nota, usuario_id } = req.body;
    
    if (!usuario_id) {
        return res.status(401).send("Usuário não identificado. Faça login novamente.");
    }

    const sql = 'INSERT INTO itens (nome, categoria, descricao, preco_nota, usuario_id) VALUES (?, ?, ?, ?, ?)';
    
    db.query(sql, [nome, categoria, descricao, preco_nota, usuario_id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao salvar novo item no banco:", err.message);
            return res.status(500).send(err);
        }
        res.redirect('/'); 
    });
});

// 5. ROTA: Deletar Item do Catálogo
app.delete('/api/itens/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM itens WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Erro ao deletar item do banco:", err.message);
            return res.status(500).send(err);
        }
        res.json({ message: 'Deletado com sucesso!' });
    });
});

// INICIALIZAÇÃO DO SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando perfeitamente em http://localhost:${PORT}`);
});