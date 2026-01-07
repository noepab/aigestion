variable "project_id" {
  description = "The GCP Project ID"
  type        = string
  default     = "aigestion-v1-848dd"
}

variable "region" {
  description = "The default GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The default GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "credentials_file" {
  description = "Path to the GCP service account key file"
  type        = string
  default     = "../../../keys/gcp_service_account.json"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}
