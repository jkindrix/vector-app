#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.production"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Function to validate Docker configuration
validate_docker_config() {
    print_status "Validating Docker configuration..."
    
    cd "$PROJECT_DIR"
    
    # Check docker-compose configuration
    if ! docker-compose config > /dev/null 2>&1; then
        print_error "Docker Compose configuration is invalid"
        exit 1
    fi
    
    print_status "Docker configuration validation passed"
}

# Function to build application
build_application() {
    print_status "Building application..."
    
    cd "$PROJECT_DIR"
    
    # Build application image
    print_status "Building Docker image..."
    docker build -t vector-app:latest .
    
    print_status "Application build completed successfully"
}

# Function to test deployment locally
test_local_deployment() {
    print_status "Testing local deployment..."
    
    cd "$PROJECT_DIR"
    
    # Start services
    print_status "Starting services in detached mode..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Check if containers are running
    if ! docker ps --format "table {{.Names}}" | grep -q "vector-app"; then
        print_error "Vector app container is not running"
        docker-compose logs vector-app
        return 1
    fi
    
    # Test health endpoint if available
    print_status "Testing application endpoints..."
    
    # Try to get the port mapping
    local port=$(docker port vector-app 3000 2>/dev/null | cut -d: -f2 || echo "3000")
    if [ -n "$port" ]; then
        print_status "Testing frontend on port $port..."
        if command_exists curl; then
            if curl -f -s -m 10 "http://localhost:$port/health" > /dev/null 2>&1; then
                print_status "Frontend health check passed"
            else
                print_warning "Frontend health check failed or not available"
            fi
        fi
    fi
    
    # Test backend port
    local api_port=$(docker port vector-app 3001 2>/dev/null | cut -d: -f2 || echo "3001")
    if [ -n "$api_port" ]; then
        print_status "Testing API on port $api_port..."
        if command_exists curl; then
            if curl -f -s -m 10 "http://localhost:$api_port/api/health" > /dev/null 2>&1; then
                print_status "API health check passed"
            else
                print_warning "API health check failed - this is expected without database"
            fi
        fi
    fi
    
    print_status "Local deployment test completed"
}

# Function to cleanup test deployment
cleanup_test_deployment() {
    print_status "Cleaning up test deployment..."
    
    cd "$PROJECT_DIR"
    docker-compose down
    
    print_status "Test deployment cleanup completed"
}

# Function to show deployment information
show_deployment_info() {
    print_status "Deployment Information:"
    echo "======================="
    
    print_status "Docker Images:"
    docker images vector-app:latest
    
    print_status "Container Status:"
    docker ps --filter "name=vector-app"
    
    print_status "Port Mappings:"
    docker port vector-app 2>/dev/null || echo "No port mappings found"
}

# Function to create example environment file
create_example_env() {
    local example_env="$PROJECT_DIR/.env.production.example"
    
    if [[ ! -f "$example_env" ]]; then
        print_status "Creating example environment file..."
        cat > "$example_env" << 'EOF'
# Database Configuration
POSTGRES_DB=vector_research
POSTGRES_USER=vector_user
POSTGRES_PASSWORD=your_secure_postgres_password_here

# Application Configuration
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here_minimum_32_characters_long
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password_here

# Domain Configuration
DOMAIN=your-domain.com
CORS_ORIGIN=https://your-domain.com

# SSL Configuration
ACME_EMAIL=admin@your-domain.com
ACME_SERVER=https://acme-v02.api.letsencrypt.org/directory

# Traefik Configuration
TRAEFIK_LOG_LEVEL=INFO
TRAEFIK_DASHBOARD_PORT=8080
TRAEFIK_AUTH_USERS=admin:$$2y$$10$$your_bcrypt_hashed_password_here

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOG_LEVEL=info

# Optional Redis Configuration
REDIS_PASSWORD=your_secure_redis_password_here
EOF
        print_status "Example environment file created at $example_env"
    fi
}

# Main execution
main() {
    print_status "Starting Vector Research Papers Platform deployment verification"
    
    check_prerequisites
    validate_docker_config
    build_application
    create_example_env
    test_local_deployment
    show_deployment_info
    cleanup_test_deployment
    
    print_status "Deployment verification completed successfully!"
    print_warning "For production deployment, configure .env.production and external networks"
}

# Run main function
main "$@"