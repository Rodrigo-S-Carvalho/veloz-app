# Provedor Kubernetes
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

# Namespace
resource "kubernetes_namespace" "loja_veloz" {
  metadata {
    name = "loja-veloz"
  }
}

# ConfigMap
resource "kubernetes_config_map" "pedidos_config" {
  metadata {
    name      = "pedidos-config"
    namespace = kubernetes_namespace.loja_veloz.metadata[0].name
  }
  data = {
    DB_HOST        = "mysql"
    DB_NAME        = "pedidos"
    PEDIDOS_URL    = "http://pedidos:8081"
    PAGAMENTOS_URL = "http://pagamentos:8082"
    ESTOQUE_URL    = "http://estoque:8083"
  }
}

# Secret (MySQL credenciais)
resource "kubernetes_secret" "pedidos_secret" {
  metadata {
    name      = "pedidos-secret"
    namespace = kubernetes_namespace.loja_veloz.metadata[0].name
  }
  data = {
    DB_USER     = base64encode("admin")
    DB_PASSWORD = base64encode("admin123")
    MYSQL_ROOT_PASSWORD = base64encode("root123")
  }
  type = "Opaque"
}

# Deployment MySQL
resource "kubernetes_deployment" "mysql" {
  metadata {
    name      = "mysql"
    namespace = kubernetes_namespace.loja_veloz.metadata[0].name
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "mysql"
      }
    }
    template {
      metadata {
        labels = {
          app = "mysql"
        }
      }
      spec {
        container {
          image = "mysql:8.0"
          name  = "mysql"
          port {
            container_port = 3306
          }
          env {
            name = "MYSQL_ROOT_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.pedidos_secret.metadata[0].name
                key  = "MYSQL_ROOT_PASSWORD"
              }
            }
          }
          env {
            name = "MYSQL_USER"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.pedidos_secret.metadata[0].name
                key  = "DB_USER"
              }
            }
          }
          env {
            name = "MYSQL_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.pedidos_secret.metadata[0].name
                key  = "DB_PASSWORD"
              }
            }
          }
          env {
            name = "MYSQL_DATABASE"
            value_from {
              config_map_key_ref {
                name = kubernetes_config_map.pedidos_config.metadata[0].name
                key  = "DB_NAME"
              }
            }
          }
        }
      }
    }
  }
  depends_on = [kubernetes_namespace.loja_veloz]
}

# Serviço MySQL
resource "kubernetes_service" "mysql" {
  metadata {
    name      = "mysql"
    namespace = kubernetes_namespace.loja_veloz.metadata[0].name
  }
  spec {
    selector = {
      app = "mysql"
    }
    port {
      port        = 3306
      target_port = 3306
    }
  }
  depends_on = [kubernetes_deployment.mysql]
}

# Deployment da API Gateway
resource "kubernetes_deployment" "api_gateway" {
  metadata {
    name      = "api-gateway"
    namespace = kubernetes_namespace.loja_veloz.metadata[0].name
  }
  spec {
    replicas = 2
    selector {
      match_labels = {
        app = "api-gateway"
      }
    }
    template {
      metadata {
        labels = {
          app = "api-gateway"
        }
      }
      spec {
        image_pull_secrets {
          name = "dockerhub-secret"
        }
        container {
          image = "rcarv/app-api-gateway:latest"
          name  = "api-gateway"
          port {
            container_port = 8080
          }
          env {
            name = "PEDIDOS_URL"
            value_from {
              config_map_key_ref {
                name = kubernetes_config_map.pedidos_config.metadata[0].name
                key  = "PEDIDOS_URL"
              }
            }
          }
          env {
            name = "PAGAMENTOS_URL"
            value_from {
              config_map_key_ref {
                name = kubernetes_config_map.pedidos_config.metadata[0].name
                key  = "PAGAMENTOS_URL"
              }
            }
          }
          env {
            name = "ESTOQUE_URL"
            value_from {
              config_map_key_ref {
                name = kubernetes_config_map.pedidos_config.metadata[0].name
                key  = "ESTOQUE_URL"
              }
            }
          }
          liveness_probe {
            http_get {
              path = "/health"
              port = 8080
            }
            initial_delay_seconds = 30
            period_seconds        = 10
          }
          readiness_probe {
            http_get {
              path = "/health"
              port = 8080
            }
            initial_delay_seconds = 10
            period_seconds        = 5
          }
        }
      }
    }
  }
  depends_on = [kubernetes_namespace.loja_veloz]
}

# Serviço API Gateway
resource "kubernetes_service" "api_gateway" {
  metadata {
    name      = "api-gateway"
    namespace = kubernetes_namespace.loja_veloz.metadata[0].name
  }
  spec {
    type = "LoadBalancer"
    selector = {
      app = "api-gateway"
    }
    port {
      port        = 8080
      target_port = 8080
    }
  }
  depends_on = [kubernetes_deployment.api_gateway]
}

# HPA
resource "kubernetes_horizontal_pod_autoscaler" "api_gateway" {
  metadata {
    name      = "api-gateway-hpa"
    namespace = kubernetes_namespace.loja_veloz.metadata[0].name
  }
  spec {
    max_replicas = 10
    min_replicas = 2
    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.api_gateway.metadata[0].name
    }
    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = 50
        }
      }
    }
  }
  depends_on = [kubernetes_deployment.api_gateway]
}