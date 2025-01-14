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
    name = "ctrl-${var.env}"
    labels = {
      App = "ctrl-${var.env}"
    }
  }
  spec {
    selector = {
      App = "ctrl-${var.env}"
    }
    port {
      port        = 80
      target_port = 8000
    }
    type = "LoadBalancer"
  }
}

#Optional: Autoscaler
/*
resource "kubernetes_horizontal_pod_autoscaler" "**CHANGE_THIS**" {
  metadata {
    name = "hpa"
  }

  depends_on = [kubernetes_deployment.**CHANGE_THIS**] #Pod to autoscale

  spec {
    min_replicas = 1
    max_replicas = 50

    scale_target_ref {
      api_version = "apps/v1"
      kind = "Deployment"
      name = "**CHANGE_THIS**" #Change to name of deployment to autoscale
    }
    target_cpu_utilization_percentage = 50
  }
}
*/
