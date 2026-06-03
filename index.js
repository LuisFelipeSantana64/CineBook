const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// CONFIGURAÇÃO DO BANCO DE DADOS NA NUVEM (AIVEN)
const db = mysql.createConnection({
    host: 'mysql-3f67d6d1-luisfelipesantana64-5ee9.h.aivencloud.com',
    port: 24871,
    user: 'avnadmin',               
    password: 'AVNS_27RQmimhjz4xT_Mdpe_', 
    ssl: {
        rejectUnauthorized: false 
    }
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados na nuvem:', err.message);
    } else {
        console.log('Conectado ao banco de dados MySQL na nuvem com sucesso!');
    }
});


app.get('/api/itens', (req, res) => {
    const sql = 'SELECT * FROM itens';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});


app.post('/salvar', (req, res) => {
    const { nome, categoria, descricao, preco_nota } = req.body;
    const sql = 'INSERT INTO itens (nome, categoria, descricao, preco_nota) VALUES (?, ?, ?, ?)';
    
    db.query(sql, [nome, categoria, descricao, preco_nota], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.redirect('/'); 
    });
});


app.delete('/api/itens/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM itens WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Deletado com sucesso!' });
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando perfeitamente em http://localhost:${PORT}`);
});