#!/bin/bash
# Deployment script for Shop Inventory Cloud Server

set -e # Exit on error

# Ensure we are in the project root
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$(readlink -f "$0")")")")"
cd "$PROJECT_ROOT"

echo "Installing dependencies..."
bun install

echo "Building applications..."
bun run build

echo "Running database migrations..."
cd server
bunx prisma migrate deploy
cd ..

echo "Restarting/Starting application with PM2..."
if pm2 describe shop-server > /dev/null; then
    pm2 reload pm2.config.js
else
    pm2 start pm2.config.js
fi

echo "Deployment complete."
