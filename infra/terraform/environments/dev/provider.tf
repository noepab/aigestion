terraform {
  required_version = ">= 1.5.0"

  backend "gcs" {
    bucket  = "aigestion-v1-tfstate-848dd"
    prefix  = "terraform/state/dev"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.80.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
  credentials = file(var.credentials_file)
}
