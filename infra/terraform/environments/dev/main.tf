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
