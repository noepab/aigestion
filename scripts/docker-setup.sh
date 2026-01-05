#!/bin/bash
# Setup script for Docker development environment
# Usage: ./scripts/docker-setup.sh

set -e

echo "🚀 Setting up Docker development environment..."
echo "================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "\n${BLUE}Step 1: Checking prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is installed${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose is installed${NC}"

# Step 2: Create .env file if it doesn't exist
echo -e "\n${BLUE}Step 2: Configuring environment variables...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env from template...${NC}"
    cp .env.docker.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your API keys and secrets${NC}"
    echo ""
    read -p "Press Enter to continue after configuring .env..."
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Step 3: Validate configuration
echo -e "\n${BLUE}Step 3: Validating Docker configuration...${NC}"
if docker-compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker Compose configuration is valid${NC}"
else
    echo -e "${RED}❌ Docker Compose configuration has errors${NC}"
    docker-compose config
    exit 1
fi

# Step 4: Create necessary directories
echo -e "\n${BLUE}Step 4: Creating directories...${NC}"
mkdir -p evaluation/results
mkdir -p monitoring/logs
mkdir -p server/logs
echo -e "${GREEN}✅ Directories created${NC}"

# Step 5: Pull base images
echo -e "\n${BLUE}Step 5: Pulling base Docker images...${NC}"
docker pull node:20-alpine
docker pull python:3.11-slim
docker pull mongo:7-jammy
docker pull rabbitmq:3-management-alpine
docker pull redis:7-alpine
docker pull nginx:alpine
echo -e "${GREEN}✅ Base images pulled${NC}"

# Step 6: Build custom images
echo -e "\n${BLUE}Step 6: Building custom Docker images...${NC}"
echo "This may take several minutes..."
docker-compose build --no-cache
echo -e "${GREEN}✅ Images built successfully${NC}"

# Step 7: Initialize volumes
echo -e "\n${BLUE}Step 7: Creating Docker volumes...${NC}"
docker volume create alejandro_mongodb-data
docker volume create alejandro_rabbitmq-data
docker volume create alejandro_redis-data
docker volume create alejandro_evaluation-results
echo -e "${GREEN}✅ Volumes created${NC}"

# Step 8: Create network
echo -e "\n${BLUE}Step 8: Creating Docker network...${NC}"
docker network create alejandro-network 2>/dev/null || echo "Network already exists"
echo -e "${GREEN}✅ Network ready${NC}"

# Step 9: Start services
echo -e "\n${BLUE}Step 9: Starting services...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Services started${NC}"

# Step 10: Wait for services to be healthy
echo -e "\n${BLUE}Step 10: Waiting for services to be healthy...${NC}"
echo "This may take 30-60 seconds..."
sleep 10

MAX_RETRIES=12
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if ./scripts/docker-health-check.sh > /dev/null 2>&1; then
        echo -e "${GREEN}✅ All services are healthy${NC}"
        break
    fi
    ((RETRY_COUNT++))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "Waiting for services... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    else
        echo -e "${YELLOW}⚠️  Services are taking longer than expected${NC}"
        echo "Check status with: docker-compose ps"
        break
    fi
done

# Summary
echo ""
echo "================================================"
echo -e "${GREEN}✅ Docker development environment setup complete!${NC}"
echo "================================================"
echo ""
echo "📋 Service URLs:"
echo "  - Frontend:        http://localhost:5173"
echo "  - Backend API:     http://localhost:3000"
echo "  - MongoDB:         mongodb://localhost:27017"
echo "  - RabbitMQ:        http://localhost:15672 (admin/change_this_rabbitmq_password)"
echo "  - Redis:           redis://localhost:6379"
echo ""
echo "📝 Useful commands:"
echo "  - View logs:       docker-compose logs -f [service]"
echo "  - Restart service: docker-compose restart [service]"
echo "  - Stop all:        docker-compose down"
echo "  - Health check:    ./scripts/docker-health-check.sh"
echo ""
echo "🧪 Run tests:"
echo "  - Docker tests:    ./scripts/docker-test.sh"
echo "  - Health check:    ./scripts/docker-health-check.sh"
echo ""
echo "Happy coding! 🚀"
