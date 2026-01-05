#!/bin/bash
# Docker testing script - validates Docker setup before deployment
# Usage: ./scripts/docker-test.sh [dev|prod]

set -e

ENV=${1:-dev}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENV" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "🧪 Testing Docker setup for $ENV environment..."
echo "================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_passed() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

test_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

test_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test 1: Check Docker is installed
echo -e "\n${BLUE}Test 1: Docker installation${NC}"
if command -v docker &> /dev/null; then
    VERSION=$(docker --version)
    test_passed "Docker is installed: $VERSION"
else
    test_failed "Docker is not installed"
    exit 1
fi

# Test 2: Check Docker Compose is available
echo -e "\n${BLUE}Test 2: Docker Compose installation${NC}"
if command -v docker-compose &> /dev/null; then
    VERSION=$(docker-compose --version)
    test_passed "Docker Compose is installed: $VERSION"
else
    test_failed "Docker Compose is not installed"
    exit 1
fi

# Test 3: Check Docker daemon is running
echo -e "\n${BLUE}Test 3: Docker daemon status${NC}"
if docker info > /dev/null 2>&1; then
    test_passed "Docker daemon is running"
else
    test_failed "Docker daemon is not running"
    exit 1
fi

# Test 4: Validate compose file syntax
echo -e "\n${BLUE}Test 4: Compose file validation${NC}"
if docker-compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
    test_passed "Compose file syntax is valid"
else
    test_failed "Compose file has syntax errors"
    docker-compose -f "$COMPOSE_FILE" config
    exit 1
fi

# Test 5: Check required files exist
echo -e "\n${BLUE}Test 5: Required files${NC}"
REQUIRED_FILES=(
    "Dockerfile"
    "Dockerfile.dev"
    "docker-compose.yml"
    "docker-compose.prod.yml"
    ".dockerignore"
    ".env.docker.example"
    ".docker/Dockerfile.evaluation"
    ".docker/mongo-init/init.sh"
    ".docker/rabbitmq/rabbitmq.conf"
    ".docker/rabbitmq/definitions.json"
    ".docker/redis/redis.conf"
    ".docker/nginx/nginx.conf"
    ".docker/nginx/nginx.dev.conf"
)

for FILE in "${REQUIRED_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        test_passed "$FILE exists"
    else
        test_failed "$FILE is missing"
    fi
done

# Test 6: Check .env file
echo -e "\n${BLUE}Test 6: Environment configuration${NC}"
if [ -f ".env" ]; then
    test_passed ".env file exists"

    # Check required environment variables
    REQUIRED_VARS=("GEMINI_API_KEY" "JWT_SECRET" "MONGO_ROOT_PASSWORD")
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$VAR=" .env 2>/dev/null; then
            VALUE=$(grep "^$VAR=" .env | cut -d'=' -f2)
            if [ -n "$VALUE" ] && [ "$VALUE" != "your-" ] && [ "$VALUE" != "change_this" ]; then
                test_passed "$VAR is configured"
            else
                test_warning "$VAR is set but may need a real value"
            fi
        else
            test_warning "$VAR is not configured in .env"
        fi
    done
else
    test_warning ".env file not found (copy from .env.docker.example)"
fi

# Test 7: Check available disk space
echo -e "\n${BLUE}Test 7: Disk space${NC}"
AVAILABLE=$(df -h . | tail -1 | awk '{print $4}')
echo "Available disk space: $AVAILABLE"
if df -h . | tail -1 | awk '{print $4}' | grep -q "G"; then
    test_passed "Sufficient disk space available"
else
    test_warning "Low disk space - Docker images require several GB"
fi

# Test 8: Test Docker build (dry-run)
echo -e "\n${BLUE}Test 8: Docker build validation${NC}"
if docker build -t alejandro-test --target deps -f Dockerfile . > /dev/null 2>&1; then
    test_passed "Dockerfile builds successfully (deps stage)"
    docker rmi alejandro-test > /dev/null 2>&1
else
    test_failed "Dockerfile build failed"
fi

# Test 9: Test network connectivity
echo -e "\n${BLUE}Test 9: Network connectivity${NC}"
if docker run --rm alpine ping -c 1 google.com > /dev/null 2>&1; then
    test_passed "Docker networking is functional"
else
    test_warning "Docker networking may have issues"
fi

# Test 10: Check port availability
echo -e "\n${BLUE}Test 10: Port availability${NC}"
PORTS=(5173 3000 27017 5672 15672 6379 80 443)
for PORT in "${PORTS[@]}"; do
    if lsof -i :$PORT > /dev/null 2>&1 || netstat -an | grep ":$PORT " > /dev/null 2>&1; then
        test_warning "Port $PORT is already in use"
    else
        test_passed "Port $PORT is available"
    fi
done

# Test 11: Check Docker resources
echo -e "\n${BLUE}Test 11: Docker resources${NC}"
if docker system df > /dev/null 2>&1; then
    echo "Docker disk usage:"
    docker system df
    test_passed "Docker system resources accessible"
else
    test_failed "Cannot access Docker system information"
fi

# Test 12: Validate service dependencies
echo -e "\n${BLUE}Test 12: Service dependencies${NC}"
SERVICES=$(docker-compose -f "$COMPOSE_FILE" config --services)
echo "Services defined: $(echo $SERVICES | tr '\n' ' ')"
test_passed "Service configuration loaded"

# Summary
echo ""
echo "================================================"
echo -e "${BLUE}Test Results Summary${NC}"
echo "================================================"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Docker setup is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review and configure .env file"
    echo "  2. Build images: docker-compose -f $COMPOSE_FILE build"
    echo "  3. Start services: docker-compose -f $COMPOSE_FILE up -d"
    echo "  4. Check health: ./scripts/docker-health-check.sh $ENV"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix issues before deploying.${NC}"
    exit 1
fi
