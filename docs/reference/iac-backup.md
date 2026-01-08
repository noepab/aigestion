# NEXUS V1 Infrastructure as Code (IaC) & Backups

This document describes the setup for advanced Infrastructure as Code (IaC) and automated backup workflows in the NEXUS V1 monorepo.

---

## Kubernetes (k8s)
- All core infrastructure is defined in `k8s/` (deployments, statefulsets, network, secrets, etc.).
- **Automated MongoDB Backups:**
  - See `k8s/mongodb-backup-cronjob.yaml` for a production-grade backup CronJob and restore script.
  - Backups run daily, are stored for 30 days, and include metadata for traceability.
  - Restore is interactive and safe (requires confirmation).

## Terraform (infra/terraform)
- Use this directory for cloud resource provisioning (e.g., managed DBs, storage, DNS, buckets, etc.).
- Example modules to add:
  - `mongodb-atlas` or managed DB
  - S3/GCS/Azure Blob for offsite backups
  - DNS, certificates, cloud storage, etc.
- See [Terraform Registry](https://registry.terraform.io/) for modules.

## How to Extend
1. Add new `.tf` files in `infra/terraform/` for cloud resources.
2. Use `terraform init && terraform plan && terraform apply` to provision.
3. Document any required secrets/variables in `infra/terraform/README.md`.

## Backup Automation
- MongoDB backup/restore is fully automated via k8s CronJob.
- For offsite/cloud backup, add a step to sync `/backup` to S3/GCS/Azure using `rclone` or similar.
- Add a GitHub Actions workflow to trigger/monitor backup status if desired.

## References
- [Kubernetes CronJob Docs](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [Terraform Docs](https://developer.hashicorp.com/terraform/docs)
- [rclone Docs](https://rclone.org/)

---

For questions or to extend IaC/backup automation, see the `k8s/` and `infra/terraform/` directories.

