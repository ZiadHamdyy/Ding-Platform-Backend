#!/bin/bash

# Render Start Script
# This script is executed when starting the service on Render

set -e

echo "🚀 Starting Ding Platform Backend..."

# Run database migrations (deploy mode - only applies new migrations)
echo "🔄 Running database migrations..."
pnpm prisma migrate deploy

# Start the application
echo "▶️ Starting application..."
pnpm run start:prod
