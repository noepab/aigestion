# Deploy weekly cost summary Cloud Function and Scheduler
# ---------------------------------------------------------------
# This script assumes:
#   • gcloud SDK is installed and you are authenticated.
#   • SendGrid API key is stored in Secret Manager as SENDGRID_API_KEY.
#   • The Cloud Function source lives in ./scripts/weekly-cost-summary-function
# ---------------------------------------------------------------

param(
    [string]$ProjectId = "aigestion",
    [string]$Region = "us-central1",
    [string]$FunctionName = "weeklyCostSummary",
    [string]$Schedule = "0 9 * * MON"   # 09:00 every Monday (UTC)
)

function Write-Step {
    param([string]$Message, [string]$Level = "INFO")
    Write-Host "[$Level] $Message"
}

# ---------------------------------------------------------------
# 1️⃣ Deploy the Cloud Function (force 1st‑gen)
# ---------------------------------------------------------------
Write-Step "Deploying Cloud Function '$FunctionName' (1st‑gen)..."
$sourcePath = Join-Path $PSScriptRoot "weekly-cost-summary-function"

gcloud functions deploy $FunctionName `
    --runtime nodejs20 `
    --trigger-http `
    --allow-unauthenticated `
    --region $Region `
    --project $ProjectId `
    --source $sourcePath `
    --entry-point weeklyCostSummary `
    --set-secrets SENDGRID_API_KEY=projects/$ProjectId/secrets/SENDGRID_API_KEY:latest `
    --quiet `
    --no-gen2

if ($LASTEXITCODE -ne 0) {
    Write-Step "❌ Cloud Function deployment failed." "ERROR"
    exit 1
}
Write-Step "✅ Cloud Function deployed (1st‑gen)."

# ---------------------------------------------------------------
# 2️⃣ Create Cloud Scheduler job
# ---------------------------------------------------------------
Write-Step "Creating Cloud Scheduler job..."
$functionUrl = "https://$Region-$ProjectId.cloudfunctions.net/$FunctionName"

gcloud scheduler jobs create http weekly-cost-summary `
    --schedule "$Schedule" `
    --uri $functionUrl `
    --http-method GET `
    --time-zone "Europe/Paris" `
    --project $ProjectId `
    --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Step "❌ Scheduler job creation failed." "ERROR"
    exit 1
}
Write-Step "✅ Scheduler job created (runs every Monday at 09:00)."

Write-Step "All set! Weekly cost‑summary emails will be sent automatically." "SUCCESS"
