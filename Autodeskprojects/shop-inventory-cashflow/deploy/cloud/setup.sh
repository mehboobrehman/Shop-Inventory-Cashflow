#!/bin/bash
# Setup script for Shop Inventory Cloud Server

set -e # Exit on error

# Ensure DOMAIN is set
if [ -z "$DOMAIN" ]; then
    echo "Please set the DOMAIN environment variable (e.g., export DOMAIN=example.com)"
    exit 1
fi

# Determine project root (assuming script is in deploy/cloud/)
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$(readlink -f "$0")")")")"

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 24, Bun, PostgreSQL, Nginx, Certbot, Logrotate
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx certbot python3-certbot-nginx logrotate
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Setup Nginx
sudo cp "$PROJECT_ROOT/deploy/cloud/nginx.conf" /etc/nginx/nginx.conf
sudo sed -i "s/\${DOMAIN}/$DOMAIN/g" /etc/nginx/nginx.conf
sudo systemctl restart nginx

# Obtain SSL Certificate
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect

# Setup PM2 with restart policies
npm install -g pm2
pm2 startup

# Log Rotation for PM2
cat <<EOF | sudo tee /etc/logrotate.d/pm2
/home/ubuntu/.pm2/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    copytruncate
}
EOF

# Environment Variables
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "Creating .env file from .env.example..."
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    echo "IMPORTANT: Please edit .env to set your PRODUCTION secrets!"
fi

# Setup Database and run migrations
echo "Running database migrations..."
cd "$PROJECT_ROOT"
bun install
cd server
bunx prisma migrate deploy
cd ..

echo "Setup complete. Start applications with: pm2 start pm2.config.js"
