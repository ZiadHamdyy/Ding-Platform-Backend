#!/bin/bash

COMPOSE_FILE="docker-compose.dev.yml"

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Attempting to start Docker service..."
    sudo service docker start
    
    # Wait a moment for it to start
    sleep 3
    
    if ! docker info > /dev/null 2>&1; then
        echo "Error: Failed to start Docker. Please run 'sudo service docker start' manually."
        exit 1
    fi
    echo "Docker service started successfully."
fi

# Check if containers are running
if docker compose -f $COMPOSE_FILE ps --services --filter "status=running" | grep -q .; then
    echo "Docker containers are currently RUNNING."
    read -p "Do you want to STOP them? (y/N): " choice
    if [[ "$choice" =~ ^[Yy]$ ]]; then
        echo "Stopping containers..."
        docker compose -f $COMPOSE_FILE down
        echo "Containers stopped."
    else
        echo "Leaving containers running."
    fi
else
    echo "Docker containers are NOT running."
    echo "Starting containers..."
    docker compose -f $COMPOSE_FILE up -d
    echo "Containers started."
fi
