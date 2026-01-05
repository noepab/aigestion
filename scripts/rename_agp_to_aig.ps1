$files = @(
    "NEXUS V1-brain-logo.svg",
    "NEXUS V1-brain-logo.png",
    "docs\IngenieroFrontendNEXUS V1_report.md",
    "docs\IngenieroBackendNEXUS V1_report.md",
    "docs\ExpertoSecurityPerfNEXUS V1_report.md",
    "docs\EspecialistaIANEXUS V1_report.md",
    "docs\DOCUMENTACION_NEXUS V1.md",
    "docs\DevOpsNEXUS V1_report.md",
    "docs\ArquitectoNEXUS V1_report.md",
    "docs\NEXUS V1_SOPORTE_USUARIOS.md",
    "docs\NEXUS V1_MEJORAS_2025.md",
    "docs\NEXUS V1_GUIA_RAPIDA.md",
    "docs\NEXUS V1_FAQ.md",
    "docs\NEXUS V1_Audit_Report_Phase3_Infrastructure.md",
    "docs\NEXUS V1_Audit_Report_Phase2_CodeQuality.md",
    "docs\NEXUS V1_Audit_Report_Phase1_Security.md",
    "docs\NEXUS V1_Audit_Report_2025-12-06.md",
    "docs\NEXUS V1_Audit_Report_2025-12-05_19-00-56.md",
    "docs\NEXUS V1_Audit_Report_2025-11-18_20-50-17.md",
    "docs\NEXUS V1_20_MEJORAS_GENERALES_2025.md",
    "task\docs\100-MEJORAS-NEXUS V1.md",
    "audit\audit_NEXUS V1.ps1",
    "monitoring\prometheus\rules\NEXUS V1-ia-engine-alerts.yml",
    "monitoring\grafana\provisioning\dashboards\NEXUS V1-ia-engine.json",
    "data\NEXUS V1_rules.json",
    "server\legacy-python-core\src\scripts\NEXUS V1_help_web.py",
    "server\legacy-python-core\src\scripts\NEXUS V1_help_bot.py",
    "frontend\apps\landingpage\src\components\NEXUS V1InfoModal.tsx",
    "frontend\apps\landingpage\src\components\NEXUS V1InfoModal.css",
    "frontend\apps\landingpage\public\NEXUS V1-brain-logo.svg",
    "frontend\apps\landing-host\src\components\NEXUS V1Logo.tsx",
    "frontend\apps\landing-host\src\components\NEXUS V1Logo.css",
    "frontend\apps\landing-host\src\components\NEXUS V1InfoModal.tsx",
    "frontend\apps\landing-host\src\components\NEXUS V1InfoModal.css",
    "frontend\apps\landing-host\public\NEXUS V1-brain-logo.svg",
    "frontend\apps\landing-host\public\NEXUS V1-brain-logo.png",
    "proyectos\NEXUS V1-decenterland",
    "server\legacy-python-core\src\legacy\NEXUS V1-ia-engine",
    "evaluation\NEXUS V1"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $newName = $file -replace "NEXUS V1", "NEXUS V1" -replace "NEXUS V1", "NEXUS V1"
        
        # Ensure parent directory exists for new name (should be same, but just in case)
        $parent = Split-Path $newName -Parent
        if (-not (Test-Path $parent)) {
            New-Item -ItemType Directory -Force -Path $parent | Out-Null
        }

        Write-Host "Renaming $file to $newName"
        Move-Item -Path $file -Destination $newName -Force
    }
    else {
        Write-Host "Skipping $file (not found)"
    }
}

