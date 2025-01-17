resource "kubernetes_deployment" "ctrl" {
  metadata {
    name = "ctrl-${var.env}"
  }

  depends_on = [helm_release.postgres]

  spec {
    selector {
      match_labels = {
        App = "ctrl-${var.env}"
      }
    }
    template {
      metadata {
        labels = {
          App = "ctrl-${var.env}"
        }
      }
      spec {
        container {
          # TEMP
          image = "australia-southeast1-docker.pkg.dev/dsp-registry-410602/docker/ctrl"
          name  = "ctrl"
          port {
            container_port = 8000
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "ctrl" {
  metadata {
    annotations = {
      "cloud.google.com/neg" : "{\"ingress\": true}",
    }
    name = "ctrl-${var.env}"
    labels = {
      App = "ctrl-${var.env}"
    }
  }

  spec {
    selector = {
      App = "ctrl-${var.env}" #This should match the kubernetes deployment
    }

    port {
      port        = 80
      target_port = 8000
    }

    type = "NodePort"
  }
}

# resource "kubernetes_ingress_v1" "gke-ingress" {
#   wait_for_load_balancer = true
#   metadata {
#     name = "gke-ingress"
#     annotations = {
#       "kubernetes.io/ingress.global-static-ip-name" = google_compute_global_address.static.name
#       "kubernetes.io/ingress.class"                 = "gce"
#       "ingress.gcp.kubernetes.io/pre-shared-cert"   = google_compute_managed_ssl_certificate.lb_default.name
#     }
#   }

#   spec {
#     default_backend {
#       service {
#         name = "primary"
#         port {
#           number = 80
#         }
#       }
#     }
#   }
# }

