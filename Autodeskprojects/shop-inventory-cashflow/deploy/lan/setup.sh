#!/bin/bash

# Ensure required commands exist
if ! command -v bun &> /dev/null; then
    echo "Error: Bun is not installed."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    exit 1
fi

# Create .env if not exists
if [ ! -f .env ]; then
  echo "Generating .env file..."
  echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
  echo "POSTGRES_PASSWORD=$(openssl rand -base64 16)" >> .env
  echo "DATABASE_URL=postgresql://shopadmin:$(grep POSTGRES_PASSWORD .env | cut -d= -f2)@localhost:5432/shop_inventory" >> .env
fi

echo "Installing dependencies..."
bun install

echo "Building application..."
npm run build

# Migrations
echo "Running migrations..."
cd server && bun prisma migrate deploy && cd ..

# Seeding
echo "Seeding database..."
cd server && bun prisma db seed && cd ..

# Open ports
echo "Configuring firewall..."
chmod +x ./deploy/lan/open_ports.sh
./deploy/lan/open_ports.sh

# Start with PM2
echo "Starting application with PM2..."
npm run start:prod

echo "Deployment complete!"
echo "You can access the application from other devices on the LAN at http://<your-machine-ip>:3000/"
