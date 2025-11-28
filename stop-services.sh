#!/bin/bash

# Ding Platform Backend - Stop All Services
# This script stops PostgreSQL, Neo4j, and Redis services locally

echo "🛑 Stopping Ding Platform Backend Services..."
echo ""

# Stop Neo4j
echo "📦 Stopping Neo4j..."
sudo service neo4j stop
if [ $? -eq 0 ]; then
    echo "✅ Neo4j stopped successfully"
else
    echo "⚠️  Neo4j may not have been running"
fi

# Stop Redis
echo "📦 Stopping Redis..."
sudo service redis-server stop
if [ $? -eq 0 ]; then
    echo "✅ Redis stopped successfully"
else
    echo "⚠️  Redis may not have been running"
fi

# Stop PostgreSQL
echo "📦 Stopping PostgreSQL..."
sudo service postgresql stop
if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL stopped successfully"
else
    echo "⚠️  PostgreSQL may not have been running"
fi

echo ""
echo "✨ All services stopped successfully!"
