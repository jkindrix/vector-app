#!/bin/bash

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check container health
check_container_health() {
    local container_name=$1
    local status=$(docker inspect --format="{{.State.Health.Status}}" "$container_name" 2>/dev/null || echo "not-found")
    
    case $status in
        "healthy")
            print_status "$container_name: healthy"
            return 0
            ;;
        "unhealthy")
            print_error "$container_name: unhealthy"
            return 1
            ;;
        "starting")
            print_warning "$container_name: starting"
            return 1
            ;;
        "not-found")
            print_error "$container_name: container not found"
            return 1
            ;;
        *)
            # Check if container is running
            if docker ps --format "{{.Names}}" | grep -q "^$container_name$"; then
                print_status "$container_name: running (no health check defined)"
                return 0
            else
                print_error "$container_name: not running"
                return 1
            fi
            ;;
    esac
}

# Function to check API endpoints
check_api_endpoints() {
    print_status "Checking API endpoints..."
    
    # Check if vector-app container is running
    if ! docker ps --format "{{.Names}}" | grep -q "vector-app"; then
        print_error "Vector app container is not running"
        return 1
    fi
    
    # Get port mappings
    local frontend_port=$(docker port vector-app 3000 2>/dev/null | cut -d: -f2 || echo "")
    local api_port=$(docker port vector-app 3001 2>/dev/null | cut -d: -f2 || echo "")
    
    # Test frontend
    if [[ -n "$frontend_port" ]] && command -v curl >/dev/null 2>&1; then
        print_status "Testing frontend on port $frontend_port..."
        if curl -f -s -m 10 "http://localhost:$frontend_port/health" >/dev/null 2>&1; then
            print_status "Frontend: OK"
        elif curl -f -s -m 10 "http://localhost:$frontend_port/" >/dev/null 2>&1; then
            print_status "Frontend: OK (root endpoint)"
        else
            print_warning "Frontend: Could not connect"
        fi
    fi
    
    # Test API
    if [[ -n "$api_port" ]] && command -v curl >/dev/null 2>&1; then
        print_status "Testing API on port $api_port..."
        if curl -f -s -m 10 "http://localhost:$api_port/api/health" >/dev/null 2>&1; then
            print_status "API: OK"
        else
            print_warning "API: Could not connect (expected without database)"
        fi
    fi
    
    if ! command -v curl >/dev/null 2>&1; then
        print_warning "curl not available, skipping HTTP endpoint tests"
    fi
}

# Function to check Docker image
check_docker_image() {
    print_status "Checking Docker image..."
    
    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "vector-app:latest"; then
        print_status "Docker image: vector-app:latest exists"
        
        # Get image size
        local size=$(docker images --format "table {{.Size}}" vector-app:latest | tail -n 1)
        print_status "Image size: $size"
    else
        print_error "Docker image vector-app:latest not found"
        return 1
    fi
}

# Function to check logs for errors
check_logs() {
    print_status "Checking recent logs for errors..."
    
    if docker ps --format "{{.Names}}" | grep -q "vector-app"; then
        # Check application logs
        local error_count=$(docker logs vector-app --since=5m 2>&1 | grep -i "error" | wc -l || echo "0")
        
        if [[ $error_count -gt 0 ]]; then
            print_warning "Found $error_count error(s) in application logs (last 5 minutes)"
            docker logs vector-app --since=5m 2>&1 | grep -i "error" | tail -5 || true
        else
            print_status "No recent errors in application logs"
        fi
    else
        print_warning "Vector app container not running, skipping log check"
    fi
}

# Function to check container resources
check_container_resources() {
    print_status "Checking container resources..."
    
    if docker ps --format "{{.Names}}" | grep -q "vector-app"; then
        print_status "Container stats for vector-app:"
        docker stats vector-app --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" || true
    else
        print_warning "Vector app container not running, skipping resource check"
    fi
}

# Function to check network connectivity
check_network_connectivity() {
    print_status "Checking network connectivity..."
    
    # Check external networks
    local networks=("web" "database")
    
    for network in "${networks[@]}"; do
        if docker network ls --format "{{.Name}}" | grep -q "^$network$"; then
            print_status "Network $network: exists"
        else
            print_warning "Network $network: not found (required for production)"
        fi
    done
}

# Main health check function
main() {
    print_status "Starting health check for Vector Research Papers Platform"
    echo "========================================================="
    
    local checks_passed=0
    local checks_total=0
    
    # Docker image check
    checks_total=$((checks_total + 1))
    if check_docker_image; then
        checks_passed=$((checks_passed + 1))
    fi
    
    # Container health checks
    containers=("vector-app")
    
    for container in "${containers[@]}"; do
        checks_total=$((checks_total + 1))
        if check_container_health "$container"; then
            checks_passed=$((checks_passed + 1))
        fi
    done
    
    # API endpoint checks
    checks_total=$((checks_total + 1))
    if check_api_endpoints; then
        checks_passed=$((checks_passed + 1))
    fi
    
    # Network connectivity checks (informational)
    check_network_connectivity
    
    # Container resource checks (informational)
    check_container_resources
    
    # Log checks (informational, don't fail)
    check_logs
    
    echo ""
    print_status "Health check summary: $checks_passed/$checks_total critical checks passed"
    
    if [[ $checks_passed -eq $checks_total ]]; then
        print_status "All critical health checks passed!"
        exit 0
    else
        print_error "Some health checks failed"
        exit 1
    fi
}

# Run main function
main "$@"