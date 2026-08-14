# Loja Veloz - Plataforma de Pedidos em Microsserviços

**Autor:** Rodrigo da Silva Carvalho
**Curso:** Análise e Desenvolvimento de Sistemas - UniFecaf

---

## 1. DESAFIO

A Loja Veloz, e-commerce de médio porte, enfrentava problemas recorrentes em produção: indisponibilidades durante deploys, dificuldade para escalar em picos de acesso e baixa rastreabilidade de falhas entre serviços.

**Problema central:** Implementar uma proposta fim a fim que reduza risco de deploy, melhore tempo de entrega, permita escalar sob demanda e aumente a confiabilidade por meio de automação, governança e telemetria.

---

## 2. ARQUITETURA

| Serviço | Porta | Função |
|---------|-------|--------|
| API Gateway | 8080 | Roteamento e orquestração |
| Pedidos | 8081 | CRUD com MySQL |
| Pagamentos | 8082 | Mock de integração externa |
| Estoque | 8083 | Verificação e baixa de produtos |
| Interface Web | 8084 | Interface para testes |
| MySQL | 3306 | Banco de dados |

---

## 3. TECNOLOGIAS

Node.js, Express, Docker, Kubernetes, MySQL, Prometheus, Grafana, Jaeger, GitHub Actions, Terraform, Helm.

---

## 4. PRÉ-REQUISITOS

- Docker Desktop com Kubernetes ativado
- kubectl
- Helm
- Git

---

## 5. AMBIENTE LOCAL (Docker Compose)

```bash
cd app
docker-compose up -d
```

Acesse: http://localhost:8084

**Testar API:**
```bash
curl -X POST http://localhost:8080/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{"produto":"notebook","quantidade":2,"usuario":"joao"}'
```

---

## 6. KUBERNETES

```bash
kubectl apply -f k8s/
kubectl get pods -n loja-veloz
kubectl get services -n loja-veloz
kubectl get hpa -n loja-veloz
```

---

## 7. OBSERVABILIDADE

```bash
# Instalar
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --set grafana.adminPassword=admin123
helm install jaeger jaegertracing/jaeger -n monitoring --set storage.type=memory --set allInOne.enabled=true

# Acessar Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Login: admin / Senha: admin123
```

---

## 8. TERRAFORM

```bash
cd terraform
terraform init
terraform apply
terraform state list
```

---

## 9. CI/CD (GitHub Actions)

Pipeline automatizado: build e push das imagens para Docker Hub.

**Secrets:** DOCKER_USERNAME, DOCKER_PASSWORD, KUBE_CONFIG

---

## 10. ESTRATÉGIAS

- **Deploy:** Rolling Update (zero downtime)
- **Escala:** HPA (2 a 10 réplicas baseado em CPU)
- **Configuração:** ConfigMaps e Secrets
- **Observabilidade:** Prometheus + Grafana + Jaeger

---

## 11. ESTRUTURA DO PROJETO

```
veloz-app/
├── app/                 (5 serviços + docker-compose.yml)
├── k8s/                 (Manifests Kubernetes)
├── terraform/           (main.tf)
├── .github/workflows/   (deploy.yaml)
└── README.md
```

---

## 12. FONTES DE PESQUISA

- https://kubernetes.io/docs/
- https://docs.docker.com/
- https://12factor.net/
- https://developer.hashicorp.com/terraform/docs
- https://docs.github.com/actions
- https://prometheus.io/docs/
- https://grafana.com/docs/
- https://www.jaegertracing.io/docs/

---

## 13. VÍDEO PITCH

[Link do vídeo no YouTube]

---

**Rodrigo da Silva Carvalho**
**Análise e Desenvolvimento de Sistemas - UniFecaf**