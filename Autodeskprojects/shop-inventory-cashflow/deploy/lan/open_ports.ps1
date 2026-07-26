Write-Host "Opening ports 3000 and 4000..."
# Add rule if it doesn't exist to avoid errors
if (-not (Get-NetFirewallRule -Name "Shop App LAN" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName "Shop App LAN" -Direction Inbound -LocalPort 3000,4000 -Protocol TCP -Action Allow
} else {
    Write-Host "Firewall rule 'Shop App LAN' already exists."
}
Write-Host "Done."
