terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "5.5.0"
    }
    kubernetes = {
      source  = "hashicorp/helm"
      version = "2.5.1"
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.1"
    }
  }
  backend "gcs" {
    bucket = "terraform-state-ctrl"
    prefix = "prod"
  }
}

module "base" {
  source = "../base"

  project_id = "peters-playground-427505"
  region     = "australia-southeast1"
  location   = "australia-southeast1-a"
  sa_email   = "ctrl-sa@peters-playground-427505.iam.gserviceaccount.com"
  env        = "prod"
  subdomain  = "ctrl.dsp"
}

output "kubernetes_cluster_name" {
  value       = module.base.kubernetes_cluster_name
  description = "GKE Cluster Name"
}
