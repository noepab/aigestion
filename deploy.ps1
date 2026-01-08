param(
    [Parameter(Mandatory = $true)]
    [string]$ImageTag
)

$manifestPath = Join-Path $PSScriptRoot "k8s\deployment.yaml"

# Replace placeholder with the provided image tag
(Get-Content $manifestPath) -replace '\$\{IMAGE_TAG\}', $ImageTag | Set-Content $manifestPath

# Apply the manifest to the cluster
kubectl apply -f $manifestPath --validate=false

# Wait for the deployment rollout to complete
kubectl rollout status deployment/aigestion

# Retrieve the external IP of the service (if LoadBalancer)
$svcJson = kubectl get svc aigestion -o json
$svc = $svcJson | ConvertFrom-Json
if ($svc.status.loadBalancer.ingress) {
    $ip = $svc.status.loadBalancer.ingress[0].ip
    Write-Host "Service external IP: $ip"
}
else {
    Write-Host "Service does not have an external IP yet."
}
