param(
    [string]$DataPath = "$PSScriptRoot\sample_dataset.json"
)

Write-Host "Running evaluation with dataset:" $DataPath
python (Join-Path $PSScriptRoot "run_evaluation.py") --data $DataPath
