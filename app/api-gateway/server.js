const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const SERVICES = {
  pedidos: process.env.PEDIDOS_URL || 'http://pedidos:8081',
  pagamentos: process.env.PAGAMENTOS_URL || 'http://pagamentos:8082',
  estoque: process.env.ESTOQUE_URL || 'http://estoque:8083'
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.post('/api/pedidos', async (req, res) => {
  try {
    const { produto, quantidade, usuario } = req.body;
    
    const estoque = await axios.post(`${SERVICES.estoque}/verificar`, {
      produto, quantidade
    });
    
    if (!estoque.data.disponivel) {
      return res.status(400).json({ erro: 'Estoque insuficiente' });
    }

    const pedido = await axios.post(`${SERVICES.pedidos}`, {
      produto, quantidade, usuario, status: 'PENDENTE'
    });

    const pagamento = await axios.post(`${SERVICES.pagamentos}`, {
      pedidoId: pedido.data.id,
      valor: estoque.data.valor
    });

    await axios.put(`${SERVICES.pedidos}/${pedido.data.id}`, {
      status: pagamento.data.status === 'APROVADO' ? 'CONFIRMADO' : 'CANCELADO'
    });

    await axios.post(`${SERVICES.estoque}/baixar`, {
      produto, quantidade
    });

    res.json({
      id: pedido.data.id,
      status: pagamento.data.status,
      message: 'Pedido processado com sucesso'
    });

  } catch (error) {
    console.error('Erro:', error.message);
    res.status(500).json({ erro: error.message });
  }
});

app.listen(8080, () => console.log('API Gateway na porta 8080'));