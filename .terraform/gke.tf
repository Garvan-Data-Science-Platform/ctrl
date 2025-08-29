resource "google_container_cluster" "primary" {
  name     = "ctrl-gke-cluster"
  location = "australia-southeast1"
  initial_node_count = 1
  remove_default_node_pool = true

  node_config {
    machine_type = "e2-medium"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "ctrl-gke-node-pool"
  location   = google_container_cluster.primary.location
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    preemptible  = false
    machine_type = "e2-medium"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

resource "google_compute_global_address" "gke_ingress" {
  name   = "gke-ingress-ip"
  address_type = "EXTERNAL"
}

resource "google_dns_record_set" "gke_ingress_ctrl" {
  name         = "ctrl.dsp.garvan.org.au."
  type         = "A"
  ttl          = 300
  managed_zone = "dsp"
  project      = "ctrl-358804"
  rrdatas      = [google_compute_global_address.gke_ingress.address]
}

resource "google_dns_record_set" "gke_ingress_ctrl_admin" {
  name         = "admin.ctrl.dsp.garvan.org.au."
  type         = "A"
  ttl          = 300
  managed_zone = "dsp"
  project      = "ctrl-358804"
  rrdatas      = [google_compute_global_address.gke_ingress.address]
}

data "google_secret_manager_secret_version" "ctrl_prod_config" {
  secret  = "ctrl-prod-config"
  project = "ctrl-358804"
  version = "latest"
}

data "google_secret_manager_secret_version_access" "ctrl_prod_config" {
  secret = "projects/43338454952/secrets/ctrl-prod-config"
}

resource "helm_release" "ctrl" {
  name       = "ctrl"
  repository = "oci://australia-southeast1-docker.pkg.dev/dsp-registry-410602/garvan-public"
  chart      = "ctrl"
  version    = "1.0.0"
  namespace  = "default"
  create_namespace = true
  values = [
    data.google_secret_manager_secret_version_access.ctrl_prod_config.secret_data
  ]
}

resource "google_compute_managed_ssl_certificate" "ctrl_ssl" {
  name = "ctrl-ssl-cert"
  managed {
    domains = [
      "ctrl.dsp.garvan.org.au",
      "admin.ctrl.dsp.garvan.org.au"
    ]
  }
}

resource "kubernetes_manifest" "ctrl_managed_cert" {

  manifest = {
    "apiVersion" = "networking.gke.io/v1"
    "kind"       = "ManagedCertificate"
    "metadata" = {
      "name"      = "ctrl-managed-cert"
      "namespace" = "default"
    }
    "spec" = {
      "domains" = [
        "ctrl.dsp.garvan.org.au",
        "admin.ctrl.dsp.garvan.org.au"
      ]
    }
  }
}