const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pagamentos' });
});

app.post('/', (req, res) => {
  const { pedidoId, valor } = req.body;
  
  const aprovado = Math.random() < 0.9;
  
  res.json({
    pedidoId,
    valor,
    status: aprovado ? 'APROVADO' : 'REJEITADO',
    transacaoId: `TXN-${Date.now()}`
  });
});

app.listen(8082, () => console.log('Serviço Pagamentos na porta 8082'));