#!/bin/bash

# Docker Production Helper Script
# Manages Docker Compose for production environment

set -e

PROJECT_NAME="ding-platform"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        print_info "Copy .env.example to .env and configure it for production"
        exit 1
    fi
    
    # Check if NODE_ENV is set to production
    if ! grep -q "NODE_ENV=production" .env; then
        print_warning "NODE_ENV is not set to production in .env file"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_success ".env file found"
}

# Start all services
start() {
    print_info "Starting production environment..."
    check_env
    docker-compose $COMPOSE_FILES up -d
    print_success "Production environment started"
    print_info "Services are running in detached mode"
    status
}

# Stop all services
stop() {
    print_info "Stopping production environment..."
    docker-compose $COMPOSE_FILES down
    print_success "Production environment stopped"
}

# Restart all services
restart() {
    print_info "Restarting production environment..."
    docker-compose $COMPOSE_FILES restart
    print_success "Production environment restarted"
}

# View logs
logs() {
    if [ -z "$1" ]; then
        docker-compose $COMPOSE_FILES logs -f --tail=100
    else
        docker-compose $COMPOSE_FILES logs -f --tail=100 "$1"
    fi
}

# Show status
status() {
    docker-compose $COMPOSE_FILES ps
}

# Build images
build() {
    print_info "Building production images..."
    docker-compose $COMPOSE_FILES build --no-cache
    print_success "Build complete"
}

# Deploy (build and start)
deploy() {
    print_info "Deploying production environment..."
    check_env
    
    print_info "Building images..."
    docker-compose $COMPOSE_FILES build
    
    print_info "Starting services..."
    docker-compose $COMPOSE_FILES up -d
    
    print_info "Running database migrations..."
    sleep 10  # Wait for services to be ready
    docker-compose $COMPOSE_FILES exec -T backend npx prisma migrate deploy
    
    print_success "Deployment complete"
    status
}

# Run migrations
migrate() {
    print_info "Running production database migrations..."
    docker-compose $COMPOSE_FILES exec backend npx prisma migrate deploy
    print_success "Migrations complete"
}

# Health check
health() {
    print_info "Checking service health..."
    
    # Check backend
    if docker-compose $COMPOSE_FILES ps backend | grep -q "Up"; then
        print_success "Backend is running"
    else
        print_error "Backend is not running"
    fi
    
    # Check postgres
    if docker-compose $COMPOSE_FILES exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL is healthy"
    else
        print_error "PostgreSQL is not healthy"
    fi
    
    # Check neo4j
    if docker-compose $COMPOSE_FILES ps neo4j | grep -q "Up (healthy)"; then
        print_success "Neo4j is healthy"
    else
        print_error "Neo4j is not healthy"
    fi
    
    # Check redis
    if docker-compose $COMPOSE_FILES exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is healthy"
    else
        print_error "Redis is not healthy"
    fi
}

# Backup databases
backup() {
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    mkdir -p "$BACKUP_DIR"
    
    print_info "Creating database backups..."
    
    # Backup PostgreSQL
    print_info "Backing up PostgreSQL..."
    docker-compose $COMPOSE_FILES exec -T postgres pg_dump -U postgres ding_db > "$BACKUP_DIR/postgres_$TIMESTAMP.sql"
    print_success "PostgreSQL backup created: $BACKUP_DIR/postgres_$TIMESTAMP.sql"
    
    # Backup Neo4j (export data)
    print_info "Neo4j backup requires manual export from Neo4j Browser or using neo4j-admin"
    
    print_success "Backup complete"
}

# View resource usage
resources() {
    print_info "Resource usage:"
    docker stats --no-stream $(docker-compose $COMPOSE_FILES ps -q)
}

# Show help
help() {
    echo "Docker Production Helper Script"
    echo ""
    echo "Usage: ./docker-prod.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs [svc]  View logs (optionally for specific service)"
    echo "  status      Show service status"
    echo "  build       Build production images"
    echo "  deploy      Full deployment (build, start, migrate)"
    echo "  migrate     Run database migrations"
    echo "  health      Check service health"
    echo "  backup      Backup databases"
    echo "  resources   Show resource usage"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-prod.sh deploy"
    echo "  ./docker-prod.sh logs backend"
    echo "  ./docker-prod.sh health"
}

# Main script logic
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$2"
        ;;
    status)
        status
        ;;
    build)
        build
        ;;
    deploy)
        deploy
        ;;
    migrate)
        migrate
        ;;
    health)
        health
        ;;
    backup)
        backup
        ;;
    resources)
        resources
        ;;
    help|"")
        help
        ;;
    *)
        print_error "Unknown command: $1"
        help
        exit 1
        ;;
esac
