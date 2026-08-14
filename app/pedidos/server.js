const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: 3306,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'pedidos',
  waitForConnections: true,
  connectionLimit: 10
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id VARCHAR(36) PRIMARY KEY,
        produto VARCHAR(100),
        quantidade INTEGER,
        usuario VARCHAR(100),
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela pedidos criada/verificada');
  } catch (err) {
    console.error('Erro ao criar tabela:', err.message);
  }
})();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pedidos' });
});

app.post('/', async (req, res) => {
  const { produto, quantidade, usuario, status } = req.body;
  const id = uuidv4();
  
  await pool.query(
    'INSERT INTO pedidos (id, produto, quantidade, usuario, status) VALUES (?, ?, ?, ?, ?)',
    [id, produto, quantidade, usuario, status || 'PENDENTE']
  );
  
  res.status(201).json({ id, produto, quantidade, usuario, status });
});

app.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ erro: 'Pedido não encontrado' });
  }
  res.json(rows[0]);
});

app.put('/:id', async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE pedidos SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ id: req.params.id, status });
});

app.listen(8081, () => console.log('Serviço Pedidos na porta 8081'));