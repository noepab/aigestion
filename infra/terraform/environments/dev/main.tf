module "network" {
  source = "../../modules/network"

  project_id   = var.project_id
  region       = var.region
  network_name = "nexus-vpc-${var.environment}"
}

module "storage" {
  source = "../../modules/storage"

  project_id  = var.project_id
  region      = var.region
  bucket_name = "nexus-assets-${var.environment}-${var.project_id}"
}

module "secrets" {
  source = "../../modules/secrets"

  project_id  = var.project_id
  secret_id   = "nexus-api-key-${var.environment}"
  secret_data = "dummy-secret-value-for-provisioning"
}
