variable "project_id" { type = string }
variable "region" { type = string }
variable "bucket_name" { type = string }

resource "google_storage_bucket" "assets" {
  name          = var.bucket_name
  location      = var.region
  project       = var.project_id
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}
