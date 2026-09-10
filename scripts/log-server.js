/**
 * Autonomous Development Telemetry & Log Server
 * Binds to 0.0.0.0:5000 (or 5001 fallback) with self-healing port recovery.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// CLI Flags
const args = process.argv.slice(2);
const isTestMode = args.includes('--test');

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bold: '\x1b[1m'
};

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'device-stream.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log utility
function appendToLogFile(level, message, data) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
  const logLine = `[${timestamp}] [${level}] ${message}${dataStr}\n`;
  fs.appendFileSync(LOG_FILE, logLine, 'utf8');
}

// Port recovery logic
function killProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && pid !== String(process.pid)) {
            pids.add(pid);
          }
        }
      }
      for (const pid of pids) {
        console.log(`${colors.yellow}[PORT RECOVERY] Terminating Windows process PID ${pid} occupying port ${port}...${colors.reset}`);
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      }
      return pids.size > 0;
    } else {
      // Unix/macOS
      const output = execSync(`lsof -t -i:${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const pids = output.trim().split('\n').filter(Boolean);
      let killed = false;
      for (const pid of pids) {
        if (pid !== String(process.pid)) {
          console.log(`${colors.yellow}[PORT RECOVERY] Terminating Unix process PID ${pid} occupying port ${port}...${colors.reset}`);
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          killed = true;
        }
      }
      return killed;
    }
  } catch (err) {
    // Netstat/lsof will exit with non-zero if no process found, which is fine
    return false;
  }
}

// Retrieve local IPv4 addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips.length > 0 ? ips : ['127.0.0.1'];
}

// Safe QR code generation
function generateQR(text) {
  let qrcode;
  try {
    qrcode = require('qrcode-terminal');
  } catch (e) {
    // Let's try to install it on the fly if needed
    try {
      console.log(`${colors.gray}[INFO] qrcode-terminal not found. Attempting auto-install...${colors.reset}`);
      execSync('npm install qrcode-terminal --no-save', { stdio: 'ignore' });
      qrcode = require('qrcode-terminal');
    } catch (installErr) {
      console.log(`${colors.yellow}[WARN] Could not install qrcode-terminal. Please scan manually via URL: ${text}${colors.reset}`);
      return;
    }
  }
  if (qrcode) {
    qrcode.generate(text, { small: true });
  }
}

// Print startup banner and QRs
function printBanner(port) {
  const ips = getLocalIpAddresses();
  const primaryIp = ips[0];

  console.clear();
  console.log(`${colors.cyan}${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}       DECOUPLED TELEMETRY & APK DISTRIBUTION SERVER            ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.green}● Status: Active${colors.reset}`);
  console.log(`${colors.green}● Binding: 0.0.0.0:${port}${colors.reset}`);
  console.log(`${colors.green}● Local IPs: ${ips.join(', ')}${colors.reset}`);
  console.log(`${colors.cyan}----------------------------------------------------------------${colors.reset}`);

  // QR 1: APK Distribution (typically port 8080)
  const apkUrl = `http://${primaryIp}:8080`;
  console.log(`\n${colors.bold}[1] APK DOWNLOAD HARNESS${colors.reset}`);
  console.log(`${colors.gray}Scan QR code with mobile camera to download APK via local Wi-Fi:${colors.reset}`);
  console.log(`${colors.blue}${colors.bold}URL: ${apkUrl}${colors.reset}`);
  generateQR(apkUrl);

  // QR 2: Telemetry config endpoint (this server's /api/config)
  const telemetryUrl = `http://${primaryIp}:${port}/api/config`;
  console.log(`\n${colors.bold}[2] TELEMETRY BINDING CONFIG${colors.reset}`);
  console.log(`${colors.gray}Scan QR code to bind the Dev Companion App dynamically:${colors.reset}`);
  console.log(`${colors.magenta}${colors.bold}URL: ${telemetryUrl}${colors.reset}`);
  generateQR(telemetryUrl);

  console.log(`${colors.cyan}----------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.gray}Logs will stream live below in real-time...${colors.reset}\n`);
}

// Create native HTTP log server
function createServer() {
  const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // GET /api/config
    if (req.method === 'GET' && parsedUrl.pathname === '/api/config') {
      const primaryIp = getLocalIpAddresses()[0];
      const responseData = {
        host: primaryIp,
        port: server.address().port,
        status: 'active',
        telemetryEndpoint: '/api/log',
        apkUrl: `http://${primaryIp}:8080/app-release.apk`
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responseData));
      return;
    }

    // POST /api/log
    if (req.method === 'POST' && parsedUrl.pathname === '/api/log') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });

      req.on('end', () => {
        let payload;
        try {
          payload = JSON.parse(body);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          return;
        }

        const { level = 'INFO', message = '', data, timestamp } = payload;
        const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

        // Print color-coded output to stdout
        let levelColor = colors.green;
        if (level === 'DEBUG') levelColor = colors.cyan;
        if (level === 'WARN') levelColor = colors.yellow;
        if (level === 'ERROR') levelColor = colors.red;

        const dataFormatted = data ? `\n  ${colors.gray}${JSON.stringify(data, null, 2).replace(/\n/g, '\n  ')}${colors.reset}` : '';
        console.log(`[${colors.gray}${time}${colors.reset}] [${levelColor}${level}${colors.reset}] ${message}${dataFormatted}`);

        // Append to log file
        try {
          appendToLogFile(level, message, data);
        } catch (err) {
          console.error(`${colors.red}[ERROR] Failed to write to device-stream.log: ${err.message}${colors.reset}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'logged' }));
      });
      return;
    }

    // Fallback standard 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });

  return server;
}

// Start Server Loop with recovery
let attemptPort = 5000;
let killAttempted = false;

function startServer() {
  const server = createServer();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`${colors.yellow}[PORT COLLISION] Port ${attemptPort} is already in use.${colors.reset}`);
      
      if (!killAttempted) {
        killAttempted = true;
        console.log(`${colors.yellow}[PORT COLLISION] Attempting port recovery by terminating blocking process...${colors.reset}`);
        const killed = killProcessOnPort(attemptPort);
        if (killed) {
          // Retry starting server after process termination
          setTimeout(() => {
            startServer();
          }, 1000);
          return;
        }
      }

      // If kill failed or was already tried, fall back to port 5001
      if (attemptPort === 5000) {
        console.log(`${colors.cyan}[PORT FALLBACK] Retrying server binding on fallback port 5001...${colors.reset}`);
        attemptPort = 5001;
        killAttempted = false;
        startServer();
      } else {
        console.error(`${colors.red}[FATAL] Both ports 5000 and 5001 are occupied. Exiting...${colors.reset}`);
        process.exit(1);
      }
    } else {
      console.error(`${colors.red}[FATAL] Server error: ${err.message}${colors.reset}`);
      process.exit(1);
    }
  });

  server.listen(attemptPort, '0.0.0.0', () => {
    if (isTestMode) {
      console.log(`${colors.green}[TEST] Log server syntax and bind test passed on port ${attemptPort}!${colors.reset}`);
      server.close();
      process.exit(0);
    } else {
      printBanner(attemptPort);
    }
  });
}

// Handle test execution cleanly
if (isTestMode) {
  console.log('[TEST] Running syntax verification for log-server.js...');
}

startServer();
