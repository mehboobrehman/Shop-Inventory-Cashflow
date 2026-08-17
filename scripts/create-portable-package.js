const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distPortableDir = path.join(rootDir, 'dist-portable');
const outputDir = path.join(distPortableDir, 'ShopInventory-Portable');
const zipFilePath = path.join(distPortableDir, 'ShopInventory-Portable.zip');

console.log('=== Creating Portable Distribution Package ===');
console.log('Project root:', rootDir);
console.log('Output directory:', outputDir);
console.log('Output archive:', zipFilePath);

// Step 1: Ensure production builds are generated
console.log('\n--- Step 1: Building shared, client and server ---');
console.log('Building shared package...');
try {
  execSync('bun run build', { cwd: path.join(rootDir, 'shared'), stdio: 'inherit' });
} catch (err) {
  try {
    execSync('npm run build', { cwd: path.join(rootDir, 'shared'), stdio: 'inherit' });
  } catch (err2) {
    execSync('npx tsc', { cwd: path.join(rootDir, 'shared'), stdio: 'inherit' });
  }
}

console.log('Building client and server...');
try {
  execSync('bun run build', { cwd: rootDir, stdio: 'inherit' });
} catch (err) {
  console.log('bun run build failed, trying npm run build...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

// Ensure generated prisma files are in server/dist/server/src/generated/prisma
const genSource = path.join(rootDir, 'server', 'src', 'generated');
const genDest = path.join(rootDir, 'server', 'dist', 'server', 'src', 'generated');
if (fs.existsSync(genSource)) {
  fs.mkdirSync(genDest, { recursive: true });
  fs.cpSync(genSource, genDest, { recursive: true, force: true });
  console.log('Copied Prisma generated client to server/dist/server/src/generated');
}

// Step 2: Clean output directory
console.log('\n--- Step 2: Preparing output directory ---');
if (!fs.existsSync(distPortableDir)) {
  fs.mkdirSync(distPortableDir, { recursive: true });
}
if (fs.existsSync(outputDir)) {
  try {
    fs.rmSync(outputDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch (e) {
    console.log('Notice: Could not remove old outputDir completely:', e.message);
  }
}
if (fs.existsSync(zipFilePath)) {
  try {
    fs.unlinkSync(zipFilePath);
  } catch (e) {
    console.log('Notice: Could not remove old zip file:', e.message);
  }
}
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(path.join(outputDir, 'bin'), { recursive: true });
fs.mkdirSync(path.join(outputDir, 'client'), { recursive: true });
fs.mkdirSync(path.join(outputDir, 'server'), { recursive: true });
fs.mkdirSync(path.join(outputDir, 'prisma'), { recursive: true });

// Step 3: Copy Node.exe
console.log('\n--- Step 3: Bundling Node.js runtime ---');
let nodeExePath = null;
const possibleNodePaths = [
  'C:\\Users\\mehboob.rehman\\nodejs\\node.exe',
  'C:\\Program Files\\nodejs\\node.exe',
  process.execPath.endsWith('node.exe') ? process.execPath : null,
];

try {
  const whereNode = execSync('where node', { encoding: 'utf-8' }).trim().split(/\r?\n/)[0];
  if (whereNode && fs.existsSync(whereNode)) {
    possibleNodePaths.unshift(whereNode);
  }
} catch (e) {
  // Ignore
}

for (const p of possibleNodePaths) {
  if (p && fs.existsSync(p) && p.toLowerCase().endsWith('node.exe')) {
    nodeExePath = p;
    break;
  }
}

if (!nodeExePath) {
  throw new Error('System node.exe not found! Unable to bundle Node.js runtime.');
}

console.log('Using node.exe from:', nodeExePath);
const targetNodePath = path.join(outputDir, 'bin', 'node.exe');
fs.copyFileSync(nodeExePath, targetNodePath);
console.log('Copied node.exe -> bin/node.exe');

// Step 4: Copy client/dist
console.log('\n--- Step 4: Copying client build ---');
const clientDistSrc = path.join(rootDir, 'client', 'dist');
const clientDistDest = path.join(outputDir, 'client', 'dist');
if (!fs.existsSync(clientDistSrc)) {
  throw new Error(`Client build folder missing at ${clientDistSrc}`);
}
fs.cpSync(clientDistSrc, clientDistDest, { recursive: true });
console.log('Copied client/dist -> ShopInventory-Portable/client/dist');

// Step 5: Copy server/dist and server/prisma
console.log('\n--- Step 5: Copying server build and Prisma schema/database ---');
const serverDistSrc = path.join(rootDir, 'server', 'dist');
const serverDistDest = path.join(outputDir, 'server', 'dist');
fs.cpSync(serverDistSrc, serverDistDest, { recursive: true });
console.log('Copied server/dist -> ShopInventory-Portable/server/dist');

const serverPrismaSrc = path.join(rootDir, 'server', 'prisma');
const serverPrismaDest = path.join(outputDir, 'server', 'prisma');

// Ensure dev.db exists in server/prisma before copying
const devDbSrc = path.join(serverPrismaSrc, 'dev.db');
if (!fs.existsSync(devDbSrc)) {
  console.log('dev.db not found in server/prisma, initializing database...');
  try {
    execSync('npx prisma db push', { cwd: path.join(rootDir, 'server'), stdio: 'inherit' });
    execSync('npx prisma db seed', { cwd: path.join(rootDir, 'server'), stdio: 'inherit' });
  } catch (err) {
    console.log('Notice: Auto DB initialization failed:', err.message);
  }
}

fs.cpSync(serverPrismaSrc, serverPrismaDest, { recursive: true });
console.log('Copied server/prisma -> ShopInventory-Portable/server/prisma');

// Also copy dev.db to root prisma/ folder just in case relative paths differ
const rootPrismaDest = path.join(outputDir, 'prisma');
fs.mkdirSync(rootPrismaDest, { recursive: true });
if (fs.existsSync(devDbSrc)) {
  fs.copyFileSync(
    devDbSrc,
    path.join(rootPrismaDest, 'dev.db')
  );
  console.log('Copied dev.db -> ShopInventory-Portable/prisma/dev.db');
}

// Step 6: Copy production dependencies
console.log('\n--- Step 6: Copying node_modules dependencies ---');
const targetServerNodeModules = path.join(outputDir, 'server', 'node_modules');
fs.mkdirSync(targetServerNodeModules, { recursive: true });

const devOnlyFolders = new Set([
  '.cache',
  '.bin',
  '.bun',
  '.vite',
  '.package-lock.json',
  '@types',
  '@vitejs',
  '@esbuild',
  '@rolldown',
  '@rollup',
  '@cspotcode',
  '@tsconfig',
  '@shop',
  'typescript',
  'ts-node',
  'ts-node-dev',
  'vite',
  'eslint',
  'prettier',
  'rimraf',
  'nodemon',
  'concurrently',
  'tsx',
  'esbuild',
  'rollup',
  'terser',
  'autoprefixer',
  'tailwindcss',
  'postcss',
  'postcss-import',
  'postcss-js',
  'postcss-load-config',
  'postcss-nested',
  'postcss-selector-parser',
  'postcss-value-parser'
]);

function copyNodeModulesFolder(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0;
  const items = fs.readdirSync(srcDir);
  let count = 0;
  for (const item of items) {
    if (devOnlyFolders.has(item)) continue;
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);

    try {
      if (item.startsWith('@')) {
        const subItems = fs.readdirSync(srcPath);
        for (const subItem of subItems) {
          const scopedName = `${item}/${subItem}`;
          if (devOnlyFolders.has(scopedName)) continue;
          const subSrcPath = path.join(srcPath, subItem);
          const subDestPath = path.join(destPath, subItem);
          fs.mkdirSync(path.dirname(subDestPath), { recursive: true });
          fs.cpSync(subSrcPath, subDestPath, { recursive: true, dereference: true, force: true });
          count++;
        }
      } else {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.cpSync(srcPath, destPath, { recursive: true, dereference: true, force: true });
        count++;
      }
    } catch (err) {
      console.warn(`Warning copying ${item}: ${err.message}`);
    }
  }
  return count;
}

// Copy server/node_modules if present
const serverNodeModules = path.join(rootDir, 'server', 'node_modules');
if (fs.existsSync(serverNodeModules)) {
  const count = copyNodeModulesFolder(serverNodeModules, targetServerNodeModules);
  console.log(`Copied ${count} packages from server/node_modules`);
}

// Copy root node_modules into targetServerNodeModules for any prisma packages if not hoisted
const rootNodeModules = path.join(rootDir, 'node_modules');

// Explicitly verify .prisma is copied into target server/node_modules
const rootPrismaModule = path.join(rootNodeModules, '.prisma');
const targetPrismaModule = path.join(targetServerNodeModules, '.prisma');
if (fs.existsSync(rootPrismaModule) && !fs.existsSync(targetPrismaModule)) {
  fs.cpSync(rootPrismaModule, targetPrismaModule, { recursive: true, dereference: true, force: true });
  console.log('Copied .prisma folder -> server/node_modules/.prisma');
}

// Clean temporary cache files from copied node_modules
const cacheDir = path.join(targetServerNodeModules, '.cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('Cleaned .cache directory from target server/node_modules');
}

// Ensure @shop/shared is properly copied and up to date in server/node_modules/@shop/shared
const targetShopShared = path.join(targetServerNodeModules, '@shop', 'shared');
if (fs.existsSync(targetShopShared)) {
  fs.rmSync(targetShopShared, { recursive: true, force: true });
}
fs.mkdirSync(targetShopShared, { recursive: true });
const sharedSrc = path.join(rootDir, 'shared');
fs.cpSync(sharedSrc, targetShopShared, { recursive: true, dereference: true, force: true });
console.log('Copied shared package -> server/node_modules/@shop/shared');

// Step 7: Generate production .env
console.log('\n--- Step 7: Generating production .env ---');
const envContent = `PORT=4000
HOST=127.0.0.1
DATABASE_URL="file:./server/prisma/dev.db"
SERVE_STATIC_CLIENT=true
CLIENT_BUILD_PATH=client/dist
JWT_SECRET=shop-inventory-portable-secret-key-2026
ENCRYPTION_KEY=shop-inventory-portable-encryption-key-2026
NODE_ENV=production
`;
fs.writeFileSync(path.join(outputDir, '.env'), envContent, 'utf-8');
console.log('Created ShopInventory-Portable/.env');

// Also create .env inside ShopInventory-Portable/server/.env for completeness
fs.writeFileSync(path.join(outputDir, 'server', '.env'), envContent, 'utf-8');
console.log('Created ShopInventory-Portable/server/.env');

// Step 8: Create Launch Shop Inventory.vbs
console.log('\n--- Step 8: Creating Launch Shop Inventory.vbs ---');
const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strScriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strScriptPath
WshShell.Run """" & strScriptPath & "\\start-server.bat""", 0, False
Set WshShell = Nothing
Set fso = Nothing
`;
fs.writeFileSync(path.join(outputDir, 'Launch Shop Inventory.vbs'), vbsContent, 'utf-8');
console.log('Created Launch Shop Inventory.vbs');

// Step 9: Create start-server.bat
console.log('\n--- Step 9: Creating start-server.bat ---');
const startBatContent = `@echo off
SETLOCAL EnableDelayedExpansion
SET "APP_DIR=%~dp0"
IF "%APP_DIR:~-1%"=="\\" SET "APP_DIR=%APP_DIR:~0,-1%"
CD /D "%APP_DIR%"
echo Starting Shop Inventory System...

rem Kill any existing process on port 4000
powershell -NoProfile -ExecutionPolicy Bypass -Command "$conn = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }" >nul 2>&1

rem Kill any other node instances running index.js
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*server\\\\dist\\\\server\\\\src\\\\index.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1

IF NOT EXIST "%APP_DIR%\\bin\\node.exe" (
    MSG * "ERROR: Bundled Node.js runtime (bin\\node.exe) missing."
    EXIT /B 1
)
SET "PATH=%APP_DIR%\\bin;%PATH%"
SET "NODE_ENV=production"
START "ShopInventory_Backend" /B "%APP_DIR%\\bin\\node.exe" "%APP_DIR%\\server\\dist\\server\\src\\index.js" > "%APP_DIR%\\server.log" 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$maxRetries=30; $i=0; while ($i -lt $maxRetries) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4000/api/v1/health' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { break } } catch {}; Start-Sleep -Milliseconds 500; $i++ }"
START "" "http://127.0.0.1:4000"
ENDLOCAL
EXIT /B 0
`;
fs.writeFileSync(path.join(outputDir, 'start-server.bat'), startBatContent, 'utf-8');
console.log('Created start-server.bat');

// Step 10: Create stop-app.bat
console.log('\n--- Step 10: Creating stop-app.bat ---');
const stopBatContent = `@echo off
SETLOCAL EnableDelayedExpansion
SET "APP_DIR=%~dp0"
IF "%APP_DIR:~-1%"=="\\" SET "APP_DIR=%APP_DIR:~0,-1%"
CD /D "%APP_DIR%"
echo Stopping Shop Inventory System...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*server\\dist\\server\\src\\index.js*' -or $_.CommandLine -like '*ShopInventory*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" 2>nul
taskkill /F /FI "WINDOWTITLE eq ShopInventory_Backend*" 2>nul
echo Shop Inventory System stopped.
ENDLOCAL
EXIT /B 0
`;
fs.writeFileSync(path.join(outputDir, 'stop-app.bat'), stopBatContent, 'utf-8');
console.log('Created stop-app.bat');

// Step 11: Create README.md
console.log('\n--- Step 11: Creating README.md ---');
const readmeContent = `# Shop Inventory & Cashflow System - Portable Edition

Welcome to the **Shop Inventory & Cashflow System**! This portable distribution allows shopkeepers & cashiers to run the application directly on any Windows PC—**no administrative privileges or Node.js installation required**.

---

## 🚀 Quick Start

1. **Extract the ZIP File**: Extract \`ShopInventory-Portable.zip\` to any folder on your computer (e.g. Desktop or \`C:\\ShopInventory\`).
2. **Launch the Application**: Double-click **\`Launch Shop Inventory.vbs\`** inside the extracted folder.
   - The backend server will start automatically in the background.
   - Your default web browser will open automatically to \`http://127.0.0.1:4000\`.

---

## 🔑 Accessing the App

- **Default URL**: \`http://127.0.0.1:4000\`
- **Initial Login Credentials**:
  - **Email**: \`admin@shop.com\`
  - **Password**: \`admin123\`

---

## 📱 LAN Access (Local Wi-Fi)

You can access the application from other phones, tablets, or computers connected to the same Wi-Fi / local network.

1. **Find Host IP Address**: Open Command Prompt (\`cmd\`) on the main PC and type \`ipconfig\`. Find your **IPv4 Address** (e.g., \`192.168.1.50\`).
2. **Open on Phone/Tablet**: On any mobile device or PC on the same Wi-Fi network, open a web browser and enter:
   \`http://<Host-IP>:4000\` (e.g., \`http://192.168.1.50:4000\`)

---

## 🛑 Stopping the App

To stop the background server when you are done for the day:
- Double-click **\`stop-app.bat\`** in the portable folder.

---

## ℹ️ Key Details

- **No Admin Rights Required**: No administrative privileges or pre-installed software (such as Node.js) are needed. The package includes a bundled portable runtime (\`bin/node.exe\`).
- **Data Preservation**: All database records are stored in \`server/prisma/dev.db\` (and backed up in \`prisma/dev.db\`).
`;
fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent, 'utf-8');
console.log('Created README.md');

// Step 12: Create zip archive
console.log('\n--- Step 12: Generating dist-portable/ShopInventory-Portable.zip ---');
if (fs.existsSync(zipFilePath)) {
  fs.unlinkSync(zipFilePath);
}

try {
  console.log('Compressing portable package using tar...');
  execSync(`tar -a -c -f "${zipFilePath}" -C "${distPortableDir}" "ShopInventory-Portable"`, { stdio: 'inherit' });
  console.log('Successfully created archive:', zipFilePath);
} catch (err) {
  console.log('tar failed, trying PowerShell Compress-Archive...');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${outputDir}' -DestinationPath '${zipFilePath}' -Force"`, { stdio: 'inherit' });
  console.log('Successfully created archive:', zipFilePath);
}

console.log('\n=== Portable Distribution Package successfully created! ===');
console.log('Folder location:', outputDir);
console.log('Zip archive location:', zipFilePath);
