#!/bin/bash

# Render Build Script
# This script is executed during the build phase on Render

set -e

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies with pnpm..."
pnpm install --frozen-lockfile

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
pnpm prisma generate

# Build the application
echo "🏗️ Building NestJS application..."
pnpm run build

echo "✅ Build completed successfully!"
