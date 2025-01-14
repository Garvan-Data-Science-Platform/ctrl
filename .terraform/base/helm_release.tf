resource "helm_release" "nginx_ingress" {
  name             = "ctrl-ingress"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true

  depends_on = [google_container_node_pool.primary_nodes]

  values = [
    "${file("${path.module}/helm_release.yaml")}"
  ]

  set {
    name  = "controller.ingressClass"
    value = "nginx"
  }

  set {
    name  = "controller.service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "defaultBackend.enabled"
    value = "true"
  }
}
