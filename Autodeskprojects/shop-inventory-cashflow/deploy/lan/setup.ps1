# Ensure required commands exist
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Error "Error: Bun is not installed."
    exit 1
}

# Create .env if not exists
if (-not (Test-Path .env)) {
    Write-Host "Generating .env file..."
    $jwt = -join ((1..48) | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 126) })
    $dbpass = -join ((1..24) | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 126) })
    "JWT_SECRET=$jwt" | Out-File .env
    "POSTGRES_PASSWORD=$dbpass" | Out-File .env -Append
    "DATABASE_URL=postgresql://shopadmin:$dbpass@localhost:5432/shop_inventory" | Out-File .env -Append
}

Write-Host "Installing dependencies..."
bun install

Write-Host "Building application..."
bun run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }

# Migrations
Write-Host "Running migrations..."
cd server
bun prisma migrate deploy
cd ..

# Seeding
Write-Host "Seeding database..."
cd server
bun prisma db seed
cd ..

# Open ports
Write-Host "Configuring firewall..."
& ./deploy/lan/open_ports.ps1

# Start with PM2
Write-Host "Starting application with PM2..."
bun run start:prod

Write-Host "Deployment complete!"
Write-Host "You can access the application from other devices on the LAN at http://<your-machine-ip>:3000/"
