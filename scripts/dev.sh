#!/bin/bash

echo "🚀 Starting Ding development environment..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.dev.yml down

# Build and start the development environment
echo "🔨 Building and starting development environment..."
docker compose -f docker-compose.dev.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Wait for Neo4j to be ready
echo "⏳ Waiting for Neo4j to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
NEO4J_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # Check if Neo4j container is running
  if docker compose -f docker-compose.dev.yml ps neo4j | grep -q "Up"; then
    # Give it a bit more time to fully initialize
    sleep 3
    echo "✅ Neo4j container is running!"
    NEO4J_READY=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "  Waiting for Neo4j container... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ "$NEO4J_READY" = false ]; then
  echo "⚠️  Neo4j container may not be ready, but continuing..."
  echo "   If seed fails, wait a bit longer and run: docker compose -f docker-compose.dev.yml exec backend pnpm prisma:seed"
fi

# Additional wait to ensure Neo4j is fully initialized
echo "⏳ Allowing Neo4j additional time to initialize..."
sleep 10

# Ask if user wants to seed the database
echo ""
read -p "🌱 Do you want to seed the database? This will DROP all existing data and create 1000 users with profiles and Neo4j nodes. (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🌱 Running database seed..."
  echo "⚠️  WARNING: This will drop all existing data in PostgreSQL and Neo4j!"
  echo ""
  
  # Run seed inside the container (use service name 'backend')
  docker compose -f docker-compose.dev.yml exec -T backend pnpm prisma:seed
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database seeded successfully!"
  else
    echo ""
    echo "❌ Seed failed. Check the logs above for details."
  fi
else
  echo "⏭️  Skipping database seed."
fi

echo ""
echo "✅ Development environment is ready!"
echo "📱 App will be available at: http://localhost:3000"
echo "🗄️  Database will be available at: localhost:5432"
echo "🔍 Prisma Studio will be available at: http://localhost:5555"
echo "💡 To stop the environment, run: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "📋 To view logs: docker compose -f docker-compose.dev.yml logs -f"
