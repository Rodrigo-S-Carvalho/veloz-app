const express = require('express');
const app = express();
app.use(express.json());

const estoque = {
  'notebook': { quantidade: 50, valor: 3500.00 },
  'smartphone': { quantidade: 100, valor: 2500.00 },
  'fone': { quantidade: 200, valor: 150.00 }
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'estoque' });
});

app.post('/verificar', (req, res) => {
  const { produto, quantidade } = req.body;
  const item = estoque[produto];
  
  if (!item) {
    return res.json({ disponivel: false, motivo: 'Produto inexistente' });
  }
  
  res.json({
    disponivel: item.quantidade >= quantidade,
    quantidade: item.quantidade,
    valor: item.valor * quantidade
  });
});

app.post('/baixar', (req, res) => {
  const { produto, quantidade } = req.body;
  
  if (!estoque[produto] || estoque[produto].quantidade < quantidade) {
    return res.status(400).json({ erro: 'Estoque insuficiente' });
  }
  
  estoque[produto].quantidade -= quantidade;
  res.json({
    produto,
    quantidade_restante: estoque[produto].quantidade
  });
});

app.listen(8083, () => console.log('Serviço Estoque na porta 8083'));