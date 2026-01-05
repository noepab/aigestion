#!/bin/bash

# Kubernetes Deployment Script
# This script deploys the entire Alejandro stack to Kubernetes

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

NAMESPACE="NEXUS V1"
K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/k8s"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Alejandro Kubernetes Deployment Script  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Function to check command
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ $1 is installed${NC}"
}

# Function to wait for pods
wait_for_pods() {
    local label=$1
    local timeout=${2:-300}
    echo -e "${YELLOW}⏳ Waiting for $label pods to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l $label -n $NAMESPACE --timeout=${timeout}s
    echo -e "${GREEN}✅ $label pods are ready${NC}"
}

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
check_command kubectl
check_command helm
echo ""

# Step 2: Check cluster connection
echo -e "${BLUE}Step 2: Checking cluster connection...${NC}"
if kubectl cluster-info &> /dev/null; then
    echo -e "${GREEN}✅ Connected to Kubernetes cluster${NC}"
    kubectl cluster-info | head -2
else
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
    echo "Please configure kubectl with: kubectl config use-context <context-name>"
    exit 1
fi
echo ""

# Step 3: Create namespace
echo -e "${BLUE}Step 3: Creating namespace...${NC}"
if kubectl get namespace $NAMESPACE &> /dev/null; then
    echo -e "${YELLOW}⚠️  Namespace $NAMESPACE already exists${NC}"
else
    kubectl apply -f "$K8S_DIR/namespace.yaml"
    echo -e "${GREEN}✅ Namespace created${NC}"
fi
echo ""

# Step 4: Check secrets
echo -e "${BLUE}Step 4: Checking secrets...${NC}"
if kubectl get secret NEXUS V1-secrets -n $NAMESPACE &> /dev/null; then
    echo -e "${GREEN}✅ NEXUS V1-secrets exists${NC}"
else
    echo -e "${RED}❌ NEXUS V1-secrets not found${NC}"
    echo ""
    echo -e "${YELLOW}Please create secrets first:${NC}"
    echo ""
    echo "kubectl create secret generic NEXUS V1-secrets \\"
    echo "  --from-literal=JWT_SECRET=your-strong-jwt-secret \\"
    echo "  --from-literal=GEMINI_API_KEY=your-gemini-api-key \\"
    echo "  --from-literal=WINDSURF_API_TOKEN=your-windsurf-token \\"
    echo "  --from-literal=MONGO_ROOT_PASSWORD=your-mongo-password \\"
    echo "  --from-literal=MONGODB_URI=mongodb://admin:your-mongo-password@mongodb-service:27017/alejandro_db?authSource=admin \\"
    echo "  --from-literal=RABBITMQ_DEFAULT_USER=admin \\"
    echo "  --from-literal=RABBITMQ_DEFAULT_PASS=your-rabbitmq-password \\"
    echo "  --from-literal=RABBITMQ_URI=amqp://admin:your-rabbitmq-password@rabbitmq-service:5672 \\"
    echo "  --from-literal=REDIS_PASSWORD=your-redis-password \\"
    echo "  -n $NAMESPACE"
    echo ""
    exit 1
fi

if kubectl get secret ghcr-secret -n $NAMESPACE &> /dev/null; then
    echo -e "${GREEN}✅ ghcr-secret exists${NC}"
else
    echo -e "${YELLOW}⚠️  ghcr-secret not found${NC}"
    echo "Create it with:"
    echo "kubectl create secret docker-registry ghcr-secret \\"
    echo "  --docker-server=ghcr.io \\"
    echo "  --docker-username=YOUR_GITHUB_USERNAME \\"
    echo "  --docker-password=YOUR_GITHUB_TOKEN \\"
    echo "  --docker-email=YOUR_EMAIL \\"
    echo "  -n $NAMESPACE"
    echo ""
    read -p "Continue without ghcr-secret? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Step 5: Apply ConfigMaps
echo -e "${BLUE}Step 5: Applying ConfigMaps...${NC}"
kubectl apply -f "$K8S_DIR/configmap.yaml"
echo -e "${GREEN}✅ ConfigMaps applied${NC}"
echo ""

# Step 6: Apply Resource Quotas
echo -e "${BLUE}Step 6: Applying Resource Quotas...${NC}"
kubectl apply -f "$K8S_DIR/resource-quota.yaml"
echo -e "${GREEN}✅ Resource quotas applied${NC}"
echo ""

# Step 7: Deploy MongoDB
echo -e "${BLUE}Step 7: Deploying MongoDB...${NC}"
kubectl apply -f "$K8S_DIR/mongodb-statefulset.yaml"
wait_for_pods "app=mongodb"
echo ""

# Step 8: Deploy RabbitMQ
echo -e "${BLUE}Step 8: Deploying RabbitMQ...${NC}"
kubectl apply -f "$K8S_DIR/rabbitmq-statefulset.yaml"
wait_for_pods "app=rabbitmq"
echo ""

# Step 9: Deploy Redis
echo -e "${BLUE}Step 9: Deploying Redis...${NC}"
kubectl apply -f "$K8S_DIR/redis-statefulset.yaml"
wait_for_pods "app=redis"
echo ""

# Step 10: Deploy Application
echo -e "${BLUE}Step 10: Deploying Application...${NC}"
kubectl apply -f "$K8S_DIR/app-deployment.yaml"
wait_for_pods "app=NEXUS V1-app"
echo ""

# Step 11: Deploy Evaluation Service
echo -e "${BLUE}Step 11: Deploying Evaluation Service...${NC}"
kubectl apply -f "$K8S_DIR/evaluation-deployment.yaml"
wait_for_pods "app=evaluation"
echo ""

# Step 12: Apply Network Policies
echo -e "${BLUE}Step 12: Applying Network Policies...${NC}"
kubectl apply -f "$K8S_DIR/network-policy.yaml"
echo -e "${GREEN}✅ Network policies applied${NC}"
echo ""

# Step 13: Apply HPA
echo -e "${BLUE}Step 13: Applying Horizontal Pod Autoscalers...${NC}"
kubectl apply -f "$K8S_DIR/hpa.yaml"
echo -e "${GREEN}✅ HPAs applied${NC}"
echo ""

# Step 14: Apply Ingress
echo -e "${BLUE}Step 14: Applying Ingress...${NC}"
if kubectl get ingressclass nginx &> /dev/null; then
    kubectl apply -f "$K8S_DIR/ingress.yaml"
    echo -e "${GREEN}✅ Ingress applied${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx Ingress Controller not found${NC}"
    echo "Install it with:"
    echo "helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx"
    echo "helm install nginx-ingress ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace"
fi
echo ""

# Step 15: Show deployment status
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Deployment Status                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -n $NAMESPACE
echo ""

echo -e "${YELLOW}Services:${NC}"
kubectl get svc -n $NAMESPACE
echo ""

echo -e "${YELLOW}Ingress:${NC}"
kubectl get ingress -n $NAMESPACE
echo ""

echo -e "${YELLOW}HPAs:${NC}"
kubectl get hpa -n $NAMESPACE
echo ""

echo -e "${YELLOW}PVCs:${NC}"
kubectl get pvc -n $NAMESPACE
echo ""

# Step 16: Show useful commands
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Useful Commands                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}View logs:${NC}"
echo "  kubectl logs -f deployment/NEXUS V1-app -n $NAMESPACE"
echo ""
echo -e "${GREEN}Get shell in pod:${NC}"
echo "  kubectl exec -it deployment/NEXUS V1-app -n $NAMESPACE -- sh"
echo ""
echo -e "${GREEN}Port forward (local access):${NC}"
echo "  kubectl port-forward svc/app-service 3000:3000 -n $NAMESPACE"
echo ""
echo -e "${GREEN}Scale deployment:${NC}"
echo "  kubectl scale deployment NEXUS V1-app --replicas=5 -n $NAMESPACE"
echo ""
echo -e "${GREEN}Check HPA status:${NC}"
echo "  kubectl get hpa -n $NAMESPACE -w"
echo ""
echo -e "${GREEN}View events:${NC}"
echo "  kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp'"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Deployment Completed Successfully!    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"

