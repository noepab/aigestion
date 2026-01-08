terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {}
variable "region" { default = "us-central1" }

resource "google_storage_bucket" "drive_backups" {
  name          = "aigestion-backups-${var.project_id}"
  location      = var.region
  force_destroy = true
}

resource "google_sql_database_instance" "postgres" {
  name             = "aigestion-db"
  database_version = "POSTGRES_15"
  region           = var.region
  settings {
    tier = "db-f1-micro"
  }
}

resource "google_redis_instance" "redis" {
  name           = "aigestion-redis"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region
}

output "bucket_name" {
  value = google_storage_bucket.drive_backups.name
}
