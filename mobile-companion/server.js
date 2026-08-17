const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const os = require('os');
const path = require('path');
const qrcode = require('qrcode-terminal');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    // Broadcast back or do whatever is needed
    // ws.send(JSON.stringify({ status: 'received', data: message.toString() }));
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Detect Local IPv4
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback
}

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIpAddress();
  const url = `http://${ip}:${PORT}`;
  
  console.log(`Server running at ${url}`);
  console.log('Scan the QR code below to open the mobile companion app:\n');
  
  qrcode.generate(url, { small: true });
});
