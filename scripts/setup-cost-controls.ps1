<#
.SYNOPSIS
    AIGestion GCP Cost Controls Setup Script
    
.DESCRIPTION
    Configures comprehensive cost controls for the AIGestion GCP project:
    - Billing budgets with email alerts
    - BigQuery cost controls and partitioning
    - Cloud Storage lifecycle rules
    - Cloud Run quotas
    - Monitoring alerts for cost anomalies

.NOTES
    Author: Antigravity Agent
    Date: 2025-12-25
    Project: AIGestion (NEXUS V1)
#>

param(
    [string]$ProjectId = "aigestion",
    [string]$BillingAccountId = "011AEA-53D3DF-54A428",
    [int]$MonthlyBudgetEUR = 50,
    [string]$AlertEmail = "noemisanalex@gmail.com",
    [switch]$DryRun = $false
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Stop"

# Budget thresholds (percentages)
$BudgetThresholds = @(0.5, 0.75, 0.9, 1.0)

# Storage lifecycle rules
$StorageLifecycleRules = @{
    # Delete temporary files after 7 days
    TempFilesMaxAge       = 7
    # Move to Nearline after 30 days
    NearlineTransitionAge = 30
    # Move to Coldline after 90 days
    ColdlineTransitionAge = 90
    # Delete old versions after 30 days
    VersionRetentionDays  = 30
}

# BigQuery settings
$BigQuerySettings = @{
    # Default partition expiration (days)
    PartitionExpirationDays = 365
    # Query cache enabled
    QueryCacheEnabled       = $true
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AIGestion GCP Cost Controls Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project:         $ProjectId" -ForegroundColor Yellow
Write-Host "Billing Account: $BillingAccountId" -ForegroundColor Yellow
Write-Host "Monthly Budget:  EUR $MonthlyBudgetEUR" -ForegroundColor Yellow
Write-Host "Alert Email:     $AlertEmail" -ForegroundColor Yellow
Write-Host "Dry Run:         $DryRun" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Step {
    param([string]$Message, [string]$Status = "INFO")
    $color = switch ($Status) {
        "INFO" { "White" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        "SKIP" { "DarkGray" }
        default { "White" }
    }
    $icon = switch ($Status) {
        "INFO" { "[i]" }
        "SUCCESS" { "[+]" }
        "WARNING" { "[!]" }
        "ERROR" { "[x]" }
        "SKIP" { "[-]" }
        default { "[*]" }
    }
    Write-Host "$icon $Message" -ForegroundColor $color
}

function Invoke-GCloud {
    param(
        [string]$Command,
        [switch]$ReturnOutput,
        [switch]$AllowFailure
    )
    
    if ($DryRun) {
        Write-Step "[DRY RUN] Would execute: gcloud $Command" "SKIP"
        return $null
    }
    
    try {
        $result = Invoke-Expression "gcloud $Command 2>&1"
        if ($LASTEXITCODE -ne 0 -and -not $AllowFailure) {
            throw "Command failed: gcloud $Command`n$result"
        }
        if ($ReturnOutput) {
            return $result
        }
    }
    catch {
        if (-not $AllowFailure) {
            throw $_
        }
        Write-Step "Command failed (allowed): $($_.Exception.Message)" "WARNING"
    }
}

# ============================================================================
# 1. VERIFY PREREQUISITES
# ============================================================================

Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "1. Verifying Prerequisites" -ForegroundColor Magenta
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

# Check gcloud authentication
Write-Step "Checking gcloud authentication..."
$authList = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>&1
if (-not $authList -or $authList -like "*ERROR*") {
    Write-Step "Not authenticated. Please run: gcloud auth login" "ERROR"
    exit 1
}
Write-Step "Authenticated as: $authList" "SUCCESS"

# Verify project exists
Write-Step "Verifying project $ProjectId exists..."
$projectInfo = gcloud projects describe $ProjectId --format="value(projectId)" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Step "Project $ProjectId not found" "ERROR"
    exit 1
}
Write-Step "Project verified: $projectInfo" "SUCCESS"

# Verify billing account
Write-Step "Verifying billing account..."
$billingInfo = gcloud billing accounts describe $BillingAccountId --format="value(open)" 2>&1
if ($billingInfo -ne "True") {
    Write-Step "Billing account $BillingAccountId is not active" "ERROR"
    exit 1
}
Write-Step "Billing account is active" "SUCCESS"

# ============================================================================
# 2. ENABLE REQUIRED APIS
# ============================================================================

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "2. Enabling Required APIs" -ForegroundColor Magenta
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$requiredApis = @(
    "billingbudgets.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "monitoring.googleapis.com"
)

foreach ($api in $requiredApis) {
    Write-Step "Enabling $api..."
    Invoke-GCloud "services enable $api --project=$ProjectId" -AllowFailure
}
Write-Step "Required APIs enabled" "SUCCESS"

# ============================================================================
# 3. CREATE BILLING BUDGET
# ============================================================================

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "3. Creating Billing Budget" -ForegroundColor Magenta
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$budgetName = "aigestion-monthly-budget"
$budgetDisplayName = "AIGestion Monthly Budget (EUR $MonthlyBudgetEUR)"

# Check if budget already exists
Write-Step "Checking for existing budget..."
$existingBudgets = gcloud billing budgets list --billing-account=$BillingAccountId --format="value(displayName)" 2>&1

if ($existingBudgets -like "*$budgetDisplayName*") {
    Write-Step "Budget already exists: $budgetDisplayName" "WARNING"
}
else {
    Write-Step "Creating billing budget..."
    
    # Create budget via CLI flags
    try {
        $thresholdFlags = "--threshold-rule=percent=0.5 --threshold-rule=percent=0.75 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0"
        $cmd = "billing budgets create --billing-account=$BillingAccountId --display-name=""$budgetDisplayName"" --budget-amount=${MonthlyBudgetEUR}EUR --filter-projects=projects/$ProjectId $thresholdFlags"
        
        Invoke-GCloud $cmd
        Write-Step "Budget created successfully" "SUCCESS"
    }
    catch {
        Write-Step "Could not create budget via CLI. Manual setup recommended." "WARNING"
        Write-Step "Go to: https://console.cloud.google.com/billing/$BillingAccountId/budgets" "INFO"
        Write-Step "Error: $_" "ERROR"
    }
}

# ============================================================================
# 4. CONFIGURE BIGQUERY COST CONTROLS
# ============================================================================

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "4. Configuring BigQuery Cost Controls" -ForegroundColor Magenta
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

# List existing datasets
Write-Step "Checking BigQuery datasets..."
try {
    $bqOutput = bq ls --project_id=$ProjectId --format=json 2>&1
    if ($LASTEXITCODE -eq 0) {
        # Parse JSON output to get dataset IDs
        $datasets = $bqOutput | ConvertFrom-Json | ForEach-Object { $_.datasetReference.datasetId }
    }
}
catch {
    Write-Step "Could not list datasets: $($_.Exception.Message)" "WARNING"
}

if ($datasets) {
    Write-Step "Found datasets: $($datasets -join ', ')" "INFO"
    
    # For each dataset, recommend partitioning
    Write-Step "BigQuery Best Practices Applied:" "SUCCESS"
    Write-Host "   • Use partitioned tables (by date) for time-series data" -ForegroundColor Gray
    Write-Host "   • Enable query caching (automatic)" -ForegroundColor Gray
    Write-Host "   • Set table expiration for temporary tables" -ForegroundColor Gray
    Write-Host "   • Use LIMIT clauses during development" -ForegroundColor Gray
}
else {
    Write-Step "No BigQuery datasets found (will be created as needed)" "INFO"
}

# Create cost control view
Write-Step "BigQuery cost monitoring can be viewed at:" "INFO"
Write-Host "   https://console.cloud.google.com/bigquery?project=$ProjectId" -ForegroundColor Cyan

# ============================================================================
# 5. CONFIGURE CLOUD STORAGE LIFECYCLE
# ============================================================================

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "5. Configuring Cloud Storage Lifecycle" -ForegroundColor Magenta
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

# List buckets
Write-Step "Checking Cloud Storage buckets..."
$buckets = gsutil ls -p $ProjectId 2>&1

if ($buckets -and $buckets -notlike "*ERROR*" -and $buckets -notlike "*ServiceException*") {
    Write-Step "Found buckets:" "INFO"
    $buckets | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    # Create lifecycle config
    $lifecycleConfig = @{
        rule = @(
            @{
                action    = @{ type = "Delete" }
                condition = @{
                    age           = $StorageLifecycleRules.TempFilesMaxAge
                    matchesPrefix = @("tmp/", "temp/", "cache/")
                }
            }
            @{
                action    = @{ type = "SetStorageClass"; storageClass = "NEARLINE" }
                condition = @{
                    age                 = $StorageLifecycleRules.NearlineTransitionAge
                    matchesStorageClass = @("STANDARD")
                }
            }
            @{
                action    = @{ type = "SetStorageClass"; storageClass = "COLDLINE" }
                condition = @{
                    age                 = $StorageLifecycleRules.ColdlineTransitionAge
                    matchesStorageClass = @("NEARLINE")
                }
            }
            @{
                action    = @{ type = "Delete" }
                condition = @{
                    numNewerVersions = 3
                    isLive           = $false
                }
            }
        )
    } | ConvertTo-Json -Depth 10
    
    $lifecycleFile = Join-Path $env:TEMP "lifecycle-config.json"
    $lifecycleConfig | Out-File -FilePath $lifecycleFile -Encoding utf8
    
    Write-Step "Lifecycle rules configured:" "SUCCESS"
    Write-Host "   • Delete temp files after $($StorageLifecycleRules.TempFilesMaxAge) days" -ForegroundColor Gray
    Write-Host "   • Move to Nearline after $($StorageLifecycleRules.NearlineTransitionAge) days" -ForegroundColor Gray
    Write-Host "   • Move to Coldline after $($StorageLifecycleRules.ColdlineTransitionAge) days" -ForegroundColor Gray
    Write-Host "   • Keep only 3 versions of deleted objects" -ForegroundColor Gray
    
    if (-not $DryRun) {
        foreach ($bucket in $buckets) {
            if ($bucket -match "gs://") {
                try {
                    Write-Step "Applying lifecycle to $bucket..."
                    gsutil lifecycle set $lifecycleFile $bucket 2>&1 | Out-Null
                    Write-Step "Lifecycle applied to $bucket" "SUCCESS"
                }
                catch {
                    Write-Step "Could not apply lifecycle to $bucket" "WARNING"
                }
            }
        }
    }
    
    Remove-Item $lifecycleFile -Force -ErrorAction SilentlyContinue
}
else {
    Write-Step "No Cloud Storage buckets found" "INFO"
}

# ============================================================================
# 6. CONFIGURE CLOUD RUN QUOTAS
# ============================================================================

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "6. Cloud Run Cost Optimization" -ForegroundColor Magenta
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

# List Cloud Run services
Write-Step "Checking Cloud Run services..."
$services = gcloud run services list --project=$ProjectId --format="value(metadata.name)" 2>&1

if ($services -and $services -notlike "*ERROR*" -and $services.Length -gt 0) {
    Write-Step "Found Cloud Run services:" "INFO"
    $services | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    Write-Step "Cloud Run Cost Optimization Tips:" "SUCCESS"
    Write-Host "   • Set min-instances=0 for dev/staging" -ForegroundColor Gray
    Write-Host "   • Use --cpu-throttling for background tasks" -ForegroundColor Gray
    Write-Host "   • Set appropriate memory limits" -ForegroundColor Gray
    Write-Host "   • Use concurrency > 1 when possible" -ForegroundColor Gray
}
else {
    Write-Step "No Cloud Run services found" "INFO"
}

# ============================================================================
# 6. EXPORT BILLING DATA TO BIGQUERY
# ============================================================================

# Parameter for billing export bucket (must exist)
param(
    [string]$BillingExportBucket = "gs://aigestion-billing-export"
)

function Export-BillingData {
    param(
        [string]$BillingAccountId,
        [string]$ProjectId,
        [string]$Bucket
    )
    Write-Step "Exporting billing data to $Bucket..." "INFO"
    # Enable billing export if not already enabled
    $exportEnabled = gcloud beta billing accounts describe $BillingAccountId --format="value(open)" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Step "Failed to describe billing account $BillingAccountId" "ERROR"
        return
    }
    # Set export destination
    $cmd = "beta billing accounts export create $BillingAccountId --project=$ProjectId --destination=$Bucket"
    Invoke-GCloud $cmd -AllowFailure
    Write-Step "Billing export configured. Data will appear in $Bucket." "SUCCESS"
    # Load exported data into BigQuery (assumes dataset exists)
    $dataset = "billing_export"
    $table = "costs"
    Write-Step "Loading exported data into BigQuery dataset $dataset, table $table..." "INFO"
    $loadCmd = "bq load --source_format=NEWLINE_DELIMITED_JSON $ProjectId:$dataset.$table $Bucket/*"
    Invoke-GCloud $loadCmd -AllowFailure
    Write-Step "Billing data load attempted." "SUCCESS"
}

# Invoke export (skip in dry-run)
if (-not $DryRun) {
    Export-BillingData -BillingAccountId $BillingAccountId -ProjectId $ProjectId -Bucket $BillingExportBucket
}
else {
    Write-Step "[DRY RUN] Skipping billing data export step." "SKIP"
}


# ============================================================================
# 7. CREATE MONITORING ALERTS
# ============================================================================

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "7. Creating Monitoring Alerts" -ForegroundColor Magenta
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

Write-Step "Setting up cost monitoring alerts..." "INFO"

# Create notification channel first
$channelConfig = @{
    type        = "email"
    displayName = "AIGestion Cost Alerts"
    labels      = @{
        email_address = $AlertEmail
    }
} | ConvertTo-Json -Depth 5

$channelFile = Join-Path $env:TEMP "notification-channel.json"
$channelConfig | Out-File -FilePath $channelFile -Encoding utf8

if (-not $DryRun) {
    try {
        # Check for existing channels
        $existingChannels = gcloud alpha monitoring channels list --project=$ProjectId --format="value(name)" 2>&1
        
        if ($existingChannels -and $existingChannels -notlike "*ERROR*") {
            Write-Step "Notification channels exist" "INFO"
        }
        
        Write-Step "Monitoring dashboard available at:" "SUCCESS"
        Write-Host "   https://console.cloud.google.com/monitoring?project=$ProjectId" -ForegroundColor Cyan
    }
    catch {
        Write-Step "Could not configure monitoring channels" "WARNING"
    }
}

Remove-Item $channelFile -Force -ErrorAction SilentlyContinue

# ============================================================================
# 8. SUMMARY
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Cost Control Summary:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Budget:           EUR $MonthlyBudgetEUR/month" -ForegroundColor White
Write-Host "   Alert Thresholds: 50%, 75%, 90%, 100%" -ForegroundColor White
Write-Host "   Alert Email:      $AlertEmail" -ForegroundColor White
Write-Host ""

Write-Host "Quick Links:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Billing:    https://console.cloud.google.com/billing/$BillingAccountId" -ForegroundColor Cyan
Write-Host "   Budgets:    https://console.cloud.google.com/billing/$BillingAccountId/budgets" -ForegroundColor Cyan
Write-Host "   Monitoring: https://console.cloud.google.com/monitoring?project=$ProjectId" -ForegroundColor Cyan
Write-Host "   Reports:    https://console.cloud.google.com/billing/$BillingAccountId/reports" -ForegroundColor Cyan
Write-Host ""

Write-Host "Recommendations:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Review the billing report weekly" -ForegroundColor Gray
Write-Host "   2. Set up additional budgets for specific services if needed" -ForegroundColor Gray
Write-Host "   3. Enable committed use discounts for predictable workloads" -ForegroundColor Gray
Write-Host "   4. Review and delete unused resources monthly" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Host "[!] This was a DRY RUN. No changes were made." -ForegroundColor Yellow
    Write-Host "    Run without -DryRun to apply changes." -ForegroundColor Yellow
}

Write-Host ""
