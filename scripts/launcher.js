const { spawn, execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

/**
 * Shop Inventory & Cashflow System - Standalone Portable Launcher
 * This script is packaged into ShopInventory.exe using pkg.
 * It starts the backend server silently, waits for health check, and launches the app window.
 */

const isPackaged = process.pkg !== undefined;
const appDir = isPackaged ? path.dirname(process.execPath) : path.resolve(__dirname, '..');
const nodeExe = path.join(appDir, 'bin', 'node.exe');
const serverScript = path.join(appDir, 'server', 'dist', 'server', 'src', 'index.js');
const logFile = path.join(appDir, 'server.log');

/**
 * Displays a native Windows Message Box using PowerShell.
 */
function showError(msg) {
  const escapedMsg = msg.replace(/'/g, "''").replace(/"/g, '`"');
  const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show("${escapedMsg}", "Shop Inventory System", "OK", "Error")`;
  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCmd}"`, { stdio: 'ignore' });
  } catch (e) {
    console.error(msg);
  }
}

async function main() {
  // 1. Kill existing processes on port 4000 to avoid "address in use" errors
  try {
    execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "$conn = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }"', { stdio: 'ignore' });
    execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like \'*server\\\\dist\\\\server\\\\src\\\\index.js*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"', { stdio: 'ignore' });
  } catch (e) {}

  // 2. Verify critical files exist in the portable package
  if (!fs.existsSync(nodeExe)) {
    showError(`ERROR: Bundled Node.js runtime missing at bin\\node.exe\n\nPlease ensure you have extracted all files from the ZIP archive.`);
    process.exit(1);
  }
  if (!fs.existsSync(serverScript)) {
    showError(`ERROR: Server script missing at server\\dist\\server\\src\\index.js\n\nThe application files appear to be corrupted or incomplete.`);
    process.exit(1);
  }

  // 3. Start the backend server silently in the background
  let outFd = 'ignore';
  try {
    outFd = fs.openSync(logFile, 'a');
    fs.writeSync(outFd, `\n--- Launching Shop Inventory System [${new Date().toISOString()}] ---\n`);
  } catch (e) {}

  const serverEnv = {
    ...process.env,
    PORT: '4000',
    NODE_ENV: 'production',
    DATABASE_URL: 'file:./server/prisma/dev.db',
    SERVE_STATIC_CLIENT: 'true',
    CLIENT_BUILD_PATH: 'client/dist'
  };

  const serverProcess = spawn(nodeExe, [serverScript], {
    cwd: appDir,
    env: serverEnv,
    detached: true,
    stdio: ['ignore', outFd, outFd]
  });
  serverProcess.unref();

  // 4. Wait for the server to become healthy
  let started = false;
  for (let i = 0; i < 30; i++) {
    const ok = await new Promise((resolve) => {
      const req = http.get('http://127.0.0.1:4000/api/v1/health', { timeout: 1000 }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.end();
    });
    if (ok) {
      started = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!started) {
    showError('ERROR: The backend server failed to start within 15 seconds.\n\nPlease check server.log for details.');
    process.exit(1);
  }

  // 5. Launch the application in an independent window (app-mode)
  const edgePaths = [
    process.env['ProgramFiles(x86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env['ProgramFiles'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env['LocalAppData'] + '\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const chromePaths = [
    process.env['ProgramFiles'] + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['ProgramFiles(x86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['LocalAppData'] + '\\Google\\Chrome\\Application\\chrome.exe'
  ];

  let browserExe = null;
  
  // Try to find Edge or Chrome via 'where' command first
  try {
    const whereEdge = execSync('where msedge', { encoding: 'utf-8' }).trim().split(/\r?\n/)[0];
    if (whereEdge && fs.existsSync(whereEdge)) browserExe = whereEdge;
  } catch (e) {}

  if (!browserExe) {
    for (const p of edgePaths) {
      if (p && fs.existsSync(p)) { browserExe = p; break; }
    }
  }

  if (!browserExe) {
    try {
      const whereChrome = execSync('where chrome', { encoding: 'utf-8' }).trim().split(/\r?\n/)[0];
      if (whereChrome && fs.existsSync(whereChrome)) browserExe = whereChrome;
    } catch (e) {}
  }

  if (!browserExe) {
    for (const p of chromePaths) {
      if (p && fs.existsSync(p)) { browserExe = p; break; }
    }
  }

  const appUrl = 'http://127.0.0.1:4000';
  const appFlags = `--app="${appUrl}" --window-size=1280,800`;

  if (browserExe) {
    // Launch in standalone app-mode
    exec(`"${browserExe}" ${appFlags}`, (err) => {
      if (err) {
        // Fallback to default browser if app-mode launch fails
        exec(`cmd /c start ${appUrl}`);
      }
    });
  } else {
    // Fallback to default system browser
    exec(`cmd /c start ${appUrl}`);
  }
}

main().catch(err => {
  showError(`FATAL LAUNCHER ERROR: ${err.message}`);
});
