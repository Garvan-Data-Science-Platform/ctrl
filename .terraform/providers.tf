# Description: This file contains the provider configuration for the project.

# Configure the Google Cloud provider
terraform {
  required_version = "~> 1.6.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.3.0"
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