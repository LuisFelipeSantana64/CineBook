const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',               
    password: '123456',   
    database: 'meu_catalogo_db'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados (Local):', err.message);
    } else {
        console.log('Conectado ao banco de dados MySQL com sucesso!');
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