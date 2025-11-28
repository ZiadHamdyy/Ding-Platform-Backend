#!/bin/bash

# Ding Platform Backend - Check Service Status
# This script checks the status of PostgreSQL, Neo4j, and Redis services

echo "🔍 Checking Ding Platform Backend Services..."
echo ""

# Check PostgreSQL
echo "📦 PostgreSQL:"
sudo service postgresql status | head -5
echo ""

# Check Redis
echo "📦 Redis:"
sudo service redis-server status | head -5
echo ""

# Check Neo4j
echo "📦 Neo4j:"
sudo service neo4j status | head -5
echo ""

# Check ports
echo "📡 Port Status:"
echo "  Port 5432 (PostgreSQL):"
sudo netstat -tlnp | grep 5432 || echo "    Not listening"
echo "  Port 6379 (Redis):"
sudo netstat -tlnp | grep 6379 || echo "    Not listening"
echo "  Port 7687 (Neo4j Bolt):"
sudo netstat -tlnp | grep 7687 || echo "    Not listening"
