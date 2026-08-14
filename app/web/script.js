const API_URL = 'http://localhost:8080';

const PRODUCTS = ['notebook', 'smartphone', 'fone'];

const form = document.getElementById('order-form');
const produtoSelect = document.getElementById('produto');
const quantidadeInput = document.getElementById('quantidade');
const usuarioInput = document.getElementById('usuario');
const responseMessage = document.getElementById('response-message');

function sanitizeInput(value) {
    const element = document.createElement('div');
    element.textContent = value;
    return element.innerHTML;
}

function validateUsuario(value) {
    const clean = value.trim();
    if (clean.length < 2 || clean.length > 50) {
        return { valid: false, message: 'Nome deve ter entre 2 e 50 caracteres' };
    }
    if (!/^[A-Za-zÀ-ÿ ]{2,50}$/.test(clean)) {
        return { valid: false, message: 'Nome deve conter apenas letras e espacos' };
    }
    return { valid: true, value: clean };
}

function validateQuantidade(value) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 999) {
        return { valid: false, message: 'Quantidade deve ser um numero entre 1 e 999' };
    }
    return { valid: true, value: num };
}

function validateProduto(value) {
    if (!PRODUCTS.includes(value)) {
        return { valid: false, message: 'Produto invalido' };
    }
    return { valid: true, value: value };
}

function showMessage(text, type) {
    responseMessage.textContent = text;
    responseMessage.className = type;
    responseMessage.style.display = 'block';
}

function clearMessage() {
    responseMessage.style.display = 'none';
}

function setFieldError(field, isValid) {
    if (isValid) {
        field.style.borderColor = '#dadce0';
        field.setAttribute('aria-invalid', 'false');
    } else {
        field.style.borderColor = '#c62828';
        field.setAttribute('aria-invalid', 'true');
    }
}

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearMessage();

    const produtoResult = validateProduto(produtoSelect.value);
    setFieldError(produtoSelect, produtoResult.valid);
    if (!produtoResult.valid) {
        showMessage(produtoResult.message, 'error');
        return;
    }

    const quantidadeResult = validateQuantidade(quantidadeInput.value);
    setFieldError(quantidadeInput, quantidadeResult.valid);
    if (!quantidadeResult.valid) {
        showMessage(quantidadeResult.message, 'error');
        return;
    }

    const usuarioResult = validateUsuario(usuarioInput.value);
    setFieldError(usuarioInput, usuarioResult.valid);
    if (!usuarioResult.valid) {
        showMessage(usuarioResult.message, 'error');
        return;
    }

    const payload = {
        produto: sanitizeInput(produtoResult.value),
        quantidade: quantidadeResult.value,
        usuario: sanitizeInput(usuarioResult.value)
    };

    try {
        const response = await fetch(API_URL + '/api/pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(
                'Pedido criado com sucesso. ID: ' + sanitizeInput(data.id) + ' | Status: ' + sanitizeInput(data.status),
                'success'
            );
            form.reset();
            quantidadeInput.value = '1';
            setFieldError(produtoSelect, true);
            setFieldError(quantidadeInput, true);
            setFieldError(usuarioInput, true);
        } else {
            showMessage('Erro: ' + sanitizeInput(data.erro || 'Falha ao processar pedido'), 'error');
        }
    } catch (error) {
        showMessage('Erro de conexao com o servidor. Verifique se a API Gateway esta rodando.', 'error');
    }
});

[produtoSelect, quantidadeInput, usuarioInput].forEach(function(field) {
    field.addEventListener('input', function() {
        clearMessage();
        setFieldError(field, true);
    });
});

async function checkHealth() {
    const services = [
        { id: 'health-gateway', name: 'API Gateway' },
        { id: 'health-pedidos', name: 'Pedidos' },
        { id: 'health-pagamentos', name: 'Pagamentos' },
        { id: 'health-estoque', name: 'Estoque' }
    ];

    for (const service of services) {
        const element = document.getElementById(service.id);
        try {
            const response = await fetch(API_URL + '/health', {
                signal: AbortSignal.timeout(3000)
            });
            if (response.ok) {
                element.textContent = 'Online';
                element.className = 'status online';
            } else {
                element.textContent = 'Offline';
                element.className = 'status offline';
            }
        } catch (error) {
            element.textContent = 'Offline';
            element.className = 'status offline';
        }
    }
}

checkHealth();
setInterval(checkHealth, 30000);