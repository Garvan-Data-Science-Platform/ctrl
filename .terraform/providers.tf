# Description: This file contains the provider configuration for the project.

# Configure the Google Cloud provider
terraform {
  required_version = "~> 1.6.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.3.0"
    }

    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13.0"
    }

    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.3.0"
    }
  }
  backend "gcs" {
    bucket = "ctrl-tf-remote-state"
    prefix = "ctrl-dev"
  }
}

# Configure provider.
provider "google" {
  project = var.project
  zone = "australia-southeast1-a"
}

# Configure beta provider.
provider "google-beta" {
  project = var.project
  zone = "australia-southeast1-a"
}

provider "kubernetes" {
  host                   = google_container_cluster.primary.endpoint
  cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
  token                  = data.google_client_config.default.access_token
}

data "google_client_config" "default" {}

provider "helm" {
  kubernetes {
    host                   = google_container_cluster.primary.endpoint
    cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
    token                  = data.google_client_config.default.access_token
  }
}