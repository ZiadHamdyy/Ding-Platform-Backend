#!/bin/bash

# Docker Development Helper Script
# Manages Docker Compose for development environment

set -e

PROJECT_NAME="ding-platform"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.override.yml"

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

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        print_info "Copy .env.example to .env and configure it"
        exit 1
    fi
    print_success ".env file found"
}

# Start all services
start() {
    print_info "Starting development environment..."
    check_env
    docker-compose $COMPOSE_FILES up -d
    print_success "Development environment started"
    print_info "Backend: http://localhost:3000"
    print_info "Prisma Studio: http://localhost:5555"
    print_info "Neo4j Browser: http://localhost:7474"
}

# Stop all services
stop() {
    print_info "Stopping development environment..."
    docker-compose $COMPOSE_FILES down
    print_success "Development environment stopped"
}

# Restart all services
restart() {
    stop
    start
}

# View logs
logs() {
    if [ -z "$1" ]; then
        docker-compose $COMPOSE_FILES logs -f
    else
        docker-compose $COMPOSE_FILES logs -f "$1"
    fi
}

# Show status
status() {
    docker-compose $COMPOSE_FILES ps
}

# Rebuild services
rebuild() {
    print_info "Rebuilding services..."
    docker-compose $COMPOSE_FILES build --no-cache
    print_success "Rebuild complete"
}

# Clean up (remove volumes)
clean() {
    print_info "This will remove all containers, networks, and volumes"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose $COMPOSE_FILES down -v
        print_success "Cleanup complete"
    else
        print_info "Cleanup cancelled"
    fi
}

# Run migrations
migrate() {
    print_info "Running database migrations..."
    docker-compose $COMPOSE_FILES exec backend pnpm prisma migrate dev
    print_success "Migrations complete"
}

# Seed database
seed() {
    print_info "Seeding database..."
    docker-compose $COMPOSE_FILES exec backend pnpm run prisma:seed
    print_success "Database seeded"
}

# Access backend shell
shell() {
    docker-compose $COMPOSE_FILES exec backend sh
}

# Show help
help() {
    echo "Docker Development Helper Script"
    echo ""
    echo "Usage: ./docker-dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs [svc]  View logs (optionally for specific service)"
    echo "  status      Show service status"
    echo "  rebuild     Rebuild all services"
    echo "  clean       Remove all containers, networks, and volumes"
    echo "  migrate     Run database migrations"
    echo "  seed        Seed the database"
    echo "  shell       Access backend container shell"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-dev.sh start"
    echo "  ./docker-dev.sh logs backend"
    echo "  ./docker-dev.sh migrate"
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
    rebuild)
        rebuild
        ;;
    clean)
        clean
        ;;
    migrate)
        migrate
        ;;
    seed)
        seed
        ;;
    shell)
        shell
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
