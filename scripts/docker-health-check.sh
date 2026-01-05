#!/bin/bash
# Health check script for Docker services
# Usage: ./scripts/docker-health-check.sh [dev|prod]

set -e

ENV=${1:-dev}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENV" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "🔍 Checking Docker service health for $ENV environment..."
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker daemon is running${NC}"

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Compose file $COMPOSE_FILE not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Compose file found: $COMPOSE_FILE${NC}"
echo ""

# Get list of services
SERVICES=$(docker-compose -f "$COMPOSE_FILE" config --services)

echo "📋 Checking services..."
echo "------------------------"

ALL_HEALTHY=true

for SERVICE in $SERVICES; do
    # Get container name
    CONTAINER=$(docker-compose -f "$COMPOSE_FILE" ps -q "$SERVICE" 2>/dev/null)

    if [ -z "$CONTAINER" ]; then
        echo -e "${YELLOW}⚠️  $SERVICE: Not running${NC}"
        ALL_HEALTHY=false
        continue
    fi

    # Check container status
    STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER" 2>/dev/null)
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null)

    if [ "$STATUS" = "running" ]; then
        if [ "$HEALTH" = "healthy" ]; then
            echo -e "${GREEN}✅ $SERVICE: Running and healthy${NC}"
        elif [ "$HEALTH" = "unhealthy" ]; then
            echo -e "${RED}❌ $SERVICE: Running but unhealthy${NC}"
            ALL_HEALTHY=false
            # Show last health check log
            docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' "$CONTAINER" | tail -n 5
        elif [ "$HEALTH" = "starting" ]; then
            echo -e "${YELLOW}⏳ $SERVICE: Starting (health check in progress)${NC}"
        else
            echo -e "${GREEN}✅ $SERVICE: Running (no health check defined)${NC}"
        fi
    else
        echo -e "${RED}❌ $SERVICE: $STATUS${NC}"
        ALL_HEALTHY=false
    fi
done

echo ""
echo "=========================="

# Service-specific health checks
echo ""
echo "🔧 Additional service checks..."
echo "--------------------------------"

# Check MongoDB
if docker-compose -f "$COMPOSE_FILE" ps | grep -q mongodb; then
    echo -n "MongoDB: "
    if docker-compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Connection OK${NC}"
    else
        echo -e "${RED}❌ Connection failed${NC}"
        ALL_HEALTHY=false
    fi
fi

# Check RabbitMQ
if docker-compose -f "$COMPOSE_FILE" ps | grep -q rabbitmq; then
    echo -n "RabbitMQ: "
    if docker-compose -f "$COMPOSE_FILE" exec -T rabbitmq rabbitmqctl status > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Management OK${NC}"
    else
        echo -e "${RED}❌ Management failed${NC}"
        ALL_HEALTHY=false
    fi
fi

# Check Redis
if docker-compose -f "$COMPOSE_FILE" ps | grep -q redis; then
    echo -n "Redis: "
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping | grep -q PONG; then
        echo -e "${GREEN}✅ Connection OK${NC}"
    else
        echo -e "${RED}❌ Connection failed${NC}"
        ALL_HEALTHY=false
    fi
fi

# Check App health endpoint
if docker-compose -f "$COMPOSE_FILE" ps | grep -q app; then
    echo -n "App /health: "
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Endpoint OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Endpoint not responding${NC}"
    fi
fi

echo ""
echo "=========================="

# Network check
echo ""
echo "🌐 Network information..."
echo "-------------------------"
NETWORK=$(docker-compose -f "$COMPOSE_FILE" config | grep -A 5 "networks:" | grep "name:" | head -n1 | awk '{print $2}')
if [ -n "$NETWORK" ]; then
    echo "Network: $NETWORK"
    CONNECTED=$(docker network inspect "$NETWORK" --format='{{len .Containers}}' 2>/dev/null || echo "0")
    echo "Connected containers: $CONNECTED"
fi

# Volume check
echo ""
echo "💾 Volume information..."
echo "------------------------"
VOLUMES=$(docker-compose -f "$COMPOSE_FILE" config --volumes)
for VOL in $VOLUMES; do
    SIZE=$(docker system df -v | grep "$VOL" | awk '{print $3}' || echo "N/A")
    echo "$VOL: $SIZE"
done

# Summary
echo ""
echo "=========================="
if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}✅ All services are healthy!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some services are unhealthy${NC}"
    echo ""
    echo "💡 Troubleshooting tips:"
    echo "  - Check logs: docker-compose -f $COMPOSE_FILE logs [service]"
    echo "  - Restart service: docker-compose -f $COMPOSE_FILE restart [service]"
    echo "  - Rebuild: docker-compose -f $COMPOSE_FILE up -d --build"
    exit 1
fi
