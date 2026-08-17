#!/bin/bash
echo "Opening ports 3000 and 4000..."
if command -v ufw > /dev/null; then
  sudo ufw allow 3000/tcp && sudo ufw allow 4000/tcp
  if [ $? -eq 0 ]; then
    echo "Ports 3000 and 4000 opened using ufw."
  else
    echo "Error: Failed to open ports using ufw."
    exit 1
  fi
elif command -v firewalld > /dev/null; then
  sudo firewall-cmd --permanent --add-port=3000/tcp
  sudo firewall-cmd --permanent --add-port=4000/tcp
  sudo firewall-cmd --reload
  if [ $? -eq 0 ]; then
    echo "Ports 3000 and 4000 opened using firewalld."
  else
    echo "Error: Failed to open ports using firewalld."
    exit 1
  fi
else
  echo "Error: Neither ufw nor firewalld found. Please open ports 3000 and 4000 manually."
  exit 1
fi
echo "Done."
