#!/bin/bash

echo "🚀 Starting Ding development environment..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.dev.yml down

# Build and start the development environment
echo "🔨 Building and starting development environment..."
docker compose -f docker-compose.dev.yml up --build

echo "✅ Development environment is ready!"
echo "📱 App will be available at: http://localhost:3000"
echo "🗄️  Database will be available at: localhost:5432"
echo "🔍 Prisma Studio will be available at: http://localhost:5555"
echo "💡 To stop the environment, run: docker-compose -f docker-compose.dev.yml down"
