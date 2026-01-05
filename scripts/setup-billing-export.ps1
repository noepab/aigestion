# PowerShell script to set up Cloud Billing export to BigQuery
# ---------------------------------------------------------------
# Prerequisites:
#   - gcloud SDK installed and authenticated
#   - bq CLI installed
#   - Billing account ID and Project ID are known
# ---------------------------------------------------------------

param(
    [string]$BillingAccountId = "011AEA-53D3DF-54A428",
    [string]$ProjectId = "aigestion",
    [string]$DatasetId = "billing_export",
    [string]$TableId = "billing_data"
)

function Write-Step {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    Write-Host "[$Level] $Message"
}

# 1. Ensure BigQuery dataset exists
Write-Step "Creating BigQuery dataset '$DatasetId' in project '$ProjectId' (if it does not already exist)."
try {
    $createDatasetCmd = "bq"
    $createDatasetArgs = @("mk", "--dataset", "${ProjectId}:${DatasetId}")
    $output = & $createDatasetCmd @createDatasetArgs 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Dataset created successfully." "SUCCESS"
    }
    else {
        # If dataset already exists, bq returns an error; treat as non‑fatal
        if ($output -match "Already exists") {
            Write-Step "Dataset already exists – proceeding." "INFO"
        }
        else {
            Write-Step "Failed to create dataset: $output" "ERROR"
            exit 1
        }
    }
}
catch {
    Write-Step "Exception while creating dataset: $_" "ERROR"
    exit 1
}

# 2. Enable Cloud Billing export to BigQuery
$destination = "$ProjectId.$DatasetId.$TableId"
Write-Step "Enabling Cloud Billing export to BigQuery table '$destination'."
$exportCmd = "gcloud beta billing accounts export create --billing-account=$BillingAccountId --destination-bigquery-table=$destination --project=$ProjectId"
try {
    $output = & $exportCmd 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Billing export enabled successfully." "SUCCESS"
    }
    else {
        Write-Step "Failed to enable billing export: $output" "ERROR"
        exit 1
    }
}
catch {
    Write-Step "Exception while enabling billing export: $_" "ERROR"
    exit 1
}

Write-Step "Setup complete. You can now query the billing data in BigQuery table '$destination'." "SUCCESS"
