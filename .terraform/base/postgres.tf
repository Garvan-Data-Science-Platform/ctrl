resource "helm_release" "postgres" {

  name = "postgres-${var.env}"

  #repository       = "https://helm.elastic.co"
  chart = "oci://registry-1.docker.io/bitnamicharts/postgresql"
  #version          = "7.16.3"

  depends_on = [google_container_node_pool.primary_nodes]

  set {
    name  = "auth.password"
    value = data.google_secret_manager_secret_version.postgres_password.secret_data
  }
  set {
    name  = "auth.database"
    value = "django"
  }
  set {
    name  = "auth.username"
    value = "pg-user"
  }

  set {
    name  = "master.service.type"
    value = "ClusterIP"
  }

}

resource "google_secret_manager_secret" "postgres_password" {
  secret_id = "postgres-password-${var.env}"

  replication {
    user_managed {
      replicas {
        location = "australia-southeast1"
      }
    }
  }

  provisioner "local-exec" { #This creates a randomly generated password
    command = "head /dev/urandom | LC_ALL=C tr -dc A-Za-z0-9 | head -c10 | gcloud secrets versions add postgres-password-${var.env} --project=${var.project_id} --data-file=-"
  }
}

data "google_secret_manager_secret_version" "postgres_password" {
  secret = google_secret_manager_secret.postgres_password.secret_id
}
