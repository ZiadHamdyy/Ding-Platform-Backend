#!/bin/bash

# Ding Platform Backend - Start All Services
# This script starts PostgreSQL, Neo4j, and Redis services locally

echo "🚀 Starting Ding Platform Backend Services..."
echo ""

# Start PostgreSQL
echo "📦 Starting PostgreSQL..."
sudo service postgresql start
if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL started successfully"
else
    echo "❌ Failed to start PostgreSQL"
    exit 1
fi

# Start Redis
echo "📦 Starting Redis..."
sudo service redis-server start
if [ $? -eq 0 ]; then
    echo "✅ Redis started successfully"
else
    echo "❌ Failed to start Redis"
    exit 1
fi

# Start Neo4j
echo "📦 Starting Neo4j..."
sudo service neo4j start
if [ $? -eq 0 ]; then
    echo "✅ Neo4j started successfully"
else
    echo "❌ Failed to start Neo4j"
    exit 1
fi

echo ""
echo "✨ All services started successfully!"
echo ""
echo "Service Status:"
echo "  PostgreSQL: Running on port 5432"
echo "  Redis:      Running on port 6379"
echo "  Neo4j:      Running on ports 7474 (HTTP) and 7687 (Bolt)"
echo ""
echo "To check service status, run: ./check-services.sh"
