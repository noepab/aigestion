#!/bin/bash

# Kubernetes Health Check Script
# Checks the health of all Alejandro components in Kubernetes

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

NAMESPACE="NEXUS V1"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Alejandro Kubernetes Health Check       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo -e "${RED}❌ Namespace $NAMESPACE not found${NC}"
    exit 1
fi

ALL_HEALTHY=true

# Function to check deployment
check_deployment() {
    local name=$1
    local label=$2

    echo -e "${BLUE}Checking $name...${NC}"

    # Get deployment status
    local desired=$(kubectl get deployment $name -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    local ready=$(kubectl get deployment $name -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    local available=$(kubectl get deployment $name -n $NAMESPACE -o jsonpath='{.status.availableReplicas}' 2>/dev/null || echo "0")

    if [ "$desired" -eq "$ready" ] && [ "$desired" -eq "$available" ]; then
        echo -e "${GREEN}✅ $name: $ready/$desired replicas ready${NC}"
    else
        echo -e "${RED}❌ $name: $ready/$desired replicas ready${NC}"
        ALL_HEALTHY=false

        # Show pod status
        kubectl get pods -l $label -n $NAMESPACE
    fi
    echo ""
}

# Function to check statefulset
check_statefulset() {
    local name=$1
    local label=$2

    echo -e "${BLUE}Checking $name...${NC}"

    # Get statefulset status
    local desired=$(kubectl get statefulset $name -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    local ready=$(kubectl get statefulset $name -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

    if [ "$desired" -eq "$ready" ]; then
        echo -e "${GREEN}✅ $name: $ready/$desired replicas ready${NC}"
    else
        echo -e "${RED}❌ $name: $ready/$desired replicas ready${NC}"
        ALL_HEALTHY=false

        # Show pod status
        kubectl get pods -l $label -n $NAMESPACE
    fi
    echo ""
}

# Function to check service
check_service() {
    local name=$1

    echo -e "${BLUE}Checking service $name...${NC}"

    if kubectl get svc $name -n $NAMESPACE &> /dev/null; then
        local endpoints=$(kubectl get endpoints $name -n $NAMESPACE -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
        if [ $endpoints -gt 0 ]; then
            echo -e "${GREEN}✅ $name: $endpoints endpoint(s)${NC}"
        else
            echo -e "${YELLOW}⚠️  $name: No endpoints${NC}"
            ALL_HEALTHY=false
        fi
    else
        echo -e "${RED}❌ $name: Service not found${NC}"
        ALL_HEALTHY=false
    fi
    echo ""
}

# Function to test pod connectivity
test_pod_connectivity() {
    local deployment=$1
    local url=$2
    local description=$3

    echo -e "${BLUE}Testing $description...${NC}"

    local pod=$(kubectl get pod -l app=$deployment -n $NAMESPACE -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$pod" ]; then
        echo -e "${RED}❌ No pod found for $deployment${NC}"
        ALL_HEALTHY=false
    else
        if kubectl exec $pod -n $NAMESPACE -- wget -q -O- $url &> /dev/null; then
            echo -e "${GREEN}✅ $description: OK${NC}"
        else
            echo -e "${RED}❌ $description: Failed${NC}"
            ALL_HEALTHY=false
        fi
    fi
    echo ""
}

# Check Deployments
echo -e "${YELLOW}═══ Checking Deployments ═══${NC}"
echo ""
check_deployment "alejandro-app" "app=alejandro-app"
check_deployment "evaluation" "app=evaluation"

# Check StatefulSets
echo -e "${YELLOW}═══ Checking StatefulSets ═══${NC}"
echo ""
check_statefulset "mongodb" "app=mongodb"
check_statefulset "rabbitmq" "app=rabbitmq"
check_statefulset "redis" "app=redis"

# Check Services
echo -e "${YELLOW}═══ Checking Services ═══${NC}"
echo ""
check_service "app-service"
check_service "evaluation-service"
check_service "mongodb-service"
check_service "rabbitmq-service"
check_service "redis-service"

# Check PVCs
echo -e "${YELLOW}═══ Checking Persistent Volume Claims ═══${NC}"
echo ""
local pvc_status=$(kubectl get pvc -n $NAMESPACE --no-headers 2>/dev/null)
if [ -z "$pvc_status" ]; then
    echo -e "${YELLOW}⚠️  No PVCs found${NC}"
else
    echo "$pvc_status" | while read line; do
        local name=$(echo $line | awk '{print $1}')
        local status=$(echo $line | awk '{print $2}')

        if [ "$status" == "Bound" ]; then
            echo -e "${GREEN}✅ $name: Bound${NC}"
        else
            echo -e "${RED}❌ $name: $status${NC}"
            ALL_HEALTHY=false
        fi
    done
fi
echo ""

# Check Ingress
echo -e "${YELLOW}═══ Checking Ingress ═══${NC}"
echo ""
if kubectl get ingress alejandro-ingress -n $NAMESPACE &> /dev/null; then
    echo -e "${GREEN}✅ Ingress exists${NC}"
    kubectl get ingress alejandro-ingress -n $NAMESPACE
else
    echo -e "${YELLOW}⚠️  Ingress not found${NC}"
fi
echo ""

# Check HPAs
echo -e "${YELLOW}═══ Checking Horizontal Pod Autoscalers ═══${NC}"
echo ""
kubectl get hpa -n $NAMESPACE
echo ""

# Check Resource Usage
echo -e "${YELLOW}═══ Resource Usage ═══${NC}"
echo ""
echo "Top Pods by CPU:"
kubectl top pods -n $NAMESPACE --sort-by=cpu 2>/dev/null || echo "Metrics server not available"
echo ""
echo "Top Pods by Memory:"
kubectl top pods -n $NAMESPACE --sort-by=memory 2>/dev/null || echo "Metrics server not available"
echo ""

# Check Recent Events
echo -e "${YELLOW}═══ Recent Events (Last 5) ═══${NC}"
echo ""
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -6
echo ""

# Final Status
if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ All Components Healthy!               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ Some Components Are Unhealthy!        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting commands:${NC}"
    echo "  kubectl logs -f deployment/alejandro-app -n $NAMESPACE"
    echo "  kubectl describe pod <pod-name> -n $NAMESPACE"
    echo "  kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp'"
    exit 1
fi

