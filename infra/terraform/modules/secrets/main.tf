variable "project_id" { type = string }
variable "secret_id" { type = string }
variable "secret_data" {
  type      = string
  sensitive = true
}

resource "google_secret_manager_secret" "secret" {
  secret_id = var.secret_id
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "version" {
  secret      = google_secret_manager_secret.secret.id
  secret_data = var.secret_data
}

output "secret_id" {
  value = google_secret_manager_secret.secret.id
}
