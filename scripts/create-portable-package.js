const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distPortableDir = path.join(rootDir, 'dist-portable');

function buildArtifact(buildType) {
  const isDebug = buildType === 'debug';
  const folderName = isDebug ? 'ShopInventory-Debug' : 'ShopInventory-Released';
  const outputDir = path.join(distPortableDir, folderName);
  const zipName = isDebug ? 'ShopInventory-Debug.zip' : 'ShopInventory-Released.zip';
  const zipFilePath = path.join(distPortableDir, zipName);

  console.log(`\n=== Creating ${buildType.toUpperCase()} Portable Distribution Package ===`);
  console.log('Output directory:', outputDir);
  console.log('Output archive:', zipFilePath);

  // Step 1: Build shared package
  console.log('\n--- Step 1: Building shared package ---');
  try {
    execSync('bun run build', { cwd: path.join(rootDir, 'shared'), stdio: 'inherit' });
  } catch (err) {
    try {
      execSync('npm run build', { cwd: path.join(rootDir, 'shared'), stdio: 'inherit' });
    } catch (err2) {
      execSync('npx tsc', { cwd: path.join(rootDir, 'shared'), stdio: 'inherit' });
    }
  }

  const clientOutDir = isDebug ? 'dist-debug' : 'dist-release';
  console.log(`\n--- Building client and server for ${buildType} ---`);
  
  try {
    execSync(`node scripts/generate-version.js`, { cwd: rootDir, stdio: 'inherit', env: { ...process.env, BUILD_TYPE: buildType } });
    execSync(`cd server && npm run compile`, { cwd: rootDir, stdio: 'inherit', env: { ...process.env, BUILD_TYPE: buildType } });
    execSync(`cd client && npm run build -- --outDir ${clientOutDir}`, { cwd: rootDir, stdio: 'inherit', env: { ...process.env, BUILD_TYPE: buildType } });
    
    // Move client build to client/dist expected by server
    const builtClientPath = path.join(rootDir, 'client', clientOutDir);
    const targetClientDist = path.join(rootDir, 'client', 'dist');
    if (fs.existsSync(targetClientDist)) {
      fs.rmSync(targetClientDist, { recursive: true, force: true });
    }
    fs.cpSync(builtClientPath, targetClientDist, { recursive: true });
  } catch (err) {
    console.error(`Build failed for ${buildType}:`, err.message);
    throw err;
  }

  // Ensure generated prisma files are copied
  const genSource = path.join(rootDir, 'server', 'src', 'generated');
  const genDest = path.join(rootDir, 'server', 'dist', 'server', 'src', 'generated');
  if (fs.existsSync(genSource)) {
    fs.mkdirSync(genDest, { recursive: true });
    try {
      fs.cpSync(genSource, genDest, { recursive: true, force: true });
    } catch (err) {
      console.log('Notice: Prisma copy fallback:', err.message);
    }
  }

  // Step 2: Prepare output directory
  if (!fs.existsSync(distPortableDir)) {
    fs.mkdirSync(distPortableDir, { recursive: true });
  }
  if (fs.existsSync(outputDir)) {
    try {
      execSync(`rd /s /q "${outputDir}"`, { stdio: 'ignore' });
    } catch (e) {}
  }
  if (fs.existsSync(zipFilePath)) {
    try {
      fs.unlinkSync(zipFilePath);
    } catch (e) {}
  }
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'bin'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'client'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'server'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'prisma'), { recursive: true });

  // Step 3: Copy Node.exe
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
  } catch (e) {}

  for (const p of possibleNodePaths) {
    if (p && fs.existsSync(p) && p.toLowerCase().endsWith('node.exe')) {
      nodeExePath = p;
      break;
    }
  }

  if (nodeExePath) {
    const targetNodePath = path.join(outputDir, 'bin', 'node.exe');
    try {
      fs.copyFileSync(nodeExePath, targetNodePath);
    } catch (err) {}
  }

  // Step 4: Copy client/dist
  const clientDistSrc = path.join(rootDir, 'client', 'dist');
  fs.cpSync(clientDistSrc, path.join(outputDir, 'client', 'dist'), { recursive: true });

  // Step 5: Copy server/dist and prisma
  fs.cpSync(path.join(rootDir, 'server', 'dist'), path.join(outputDir, 'server', 'dist'), { recursive: true, force: true });
  
  const serverPrismaSrc = path.join(rootDir, 'server', 'prisma');
  const serverPrismaDest = path.join(outputDir, 'server', 'prisma');
  fs.cpSync(serverPrismaSrc, serverPrismaDest, { recursive: true });
  
  const devDbSrc = path.join(serverPrismaSrc, 'dev.db');
  if (fs.existsSync(devDbSrc)) {
    fs.mkdirSync(path.join(outputDir, 'prisma'), { recursive: true });
    fs.copyFileSync(devDbSrc, path.join(outputDir, 'prisma', 'dev.db'));
  }

  // Step 6: Copy dependencies & node_modules
  const targetServerNodeModules = path.join(outputDir, 'server', 'node_modules');
  fs.mkdirSync(targetServerNodeModules, { recursive: true });
  
  const serverNodeModules = path.join(rootDir, 'server', 'node_modules');
  if (fs.existsSync(serverNodeModules)) {
    fs.cpSync(serverNodeModules, targetServerNodeModules, { recursive: true, dereference: true, force: true });
  }
  const rootPrismaModule = path.join(rootDir, 'node_modules', '.prisma');
  const targetPrismaModule = path.join(targetServerNodeModules, '.prisma');
  if (fs.existsSync(rootPrismaModule) && !fs.existsSync(targetPrismaModule)) {
    fs.cpSync(rootPrismaModule, targetPrismaModule, { recursive: true, dereference: true, force: true });
  }

  // Copy shared
  const targetShopShared = path.join(targetServerNodeModules, '@shop', 'shared');
  fs.mkdirSync(targetShopShared, { recursive: true });
  fs.cpSync(path.join(rootDir, 'shared'), targetShopShared, { recursive: true, dereference: true, force: true });

  // Step 7: Generate .env with BUILD_TYPE
  const envContent = `PORT=4000
HOST=127.0.0.1
DATABASE_URL="file:./server/prisma/dev.db"
SERVE_STATIC_CLIENT=true
CLIENT_BUILD_PATH=client/dist
JWT_SECRET=shop-inventory-portable-secret-key-2026
ENCRYPTION_KEY=shop-inventory-portable-encryption-key-2026
NODE_ENV=${isDebug ? 'development' : 'production'}
BUILD_TYPE=${buildType}
`;
  fs.writeFileSync(path.join(outputDir, '.env'), envContent, 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'server', '.env'), envContent, 'utf-8');

  // Step 8: Launchers & Scripts
  const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strScriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strScriptPath
If fso.FileExists(strScriptPath & "\\ShopInventory.exe") Then
    WshShell.Run """" & strScriptPath & "\\ShopInventory.exe""", 0, False
Else
    WshShell.Run """" & strScriptPath & "\\start-server.bat""", 0, False
End If
Set WshShell = Nothing
Set fso = Nothing
`;
  fs.writeFileSync(path.join(outputDir, 'Launch Shop Inventory.vbs'), vbsContent, 'utf-8');

  const launcherSrc = path.join(rootDir, 'scripts', 'launcher.js');
  if (fs.existsSync(launcherSrc)) {
    try {
      execSync(`npx pkg "${launcherSrc}" --targets node18-win-x64 --output "${path.join(outputDir, 'ShopInventory.exe')}"`, { stdio: 'inherit' });
      fs.copyFileSync(path.join(outputDir, 'ShopInventory.exe'), path.join(outputDir, 'launcher.exe'));
    } catch (err) {}
  }

  const startBatContent = `@echo off
SETLOCAL EnableDelayedExpansion
SET "APP_DIR=%~dp0"
IF "%APP_DIR:~-1%"=="\\" SET "APP_DIR=%APP_DIR:~0,-1%"
CD /D "%APP_DIR%"
echo Starting Shop Inventory System (${buildType.toUpperCase()})...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$conn = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }" >nul 2>&1

IF NOT EXIST "%APP_DIR%\\bin\\node.exe" (
    MSG * "ERROR: Bundled Node.js runtime missing."
    EXIT /B 1
)
SET "PATH=%APP_DIR%\\bin;%PATH%"
SET "NODE_ENV=${isDebug ? 'development' : 'production'}"
SET "BUILD_TYPE=${buildType}"
START "ShopInventory_Backend_${buildType}" /B "%APP_DIR%\\bin\\node.exe" "%APP_DIR%\\server\\dist\\server\\src\\index.js" > "%APP_DIR%\\server.log" 2>&1

echo Waiting for server to start...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$maxRetries=30; $i=0; while ($i -lt $maxRetries) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4000/api/v1/health' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { break } } catch {}; Start-Sleep -Milliseconds 500; $i++ }"

SET "BROWSER_EXE="
FOR /F "tokens=*" %%I IN ('where msedge 2^>nul') DO IF NOT DEFINED BROWSER_EXE SET "BROWSER_EXE=%%I"
IF NOT DEFINED BROWSER_EXE FOR /F "tokens=*" %%I IN ('where chrome 2^>nul') DO IF NOT DEFINED BROWSER_EXE SET "BROWSER_EXE=%%I"
IF DEFINED BROWSER_EXE (
    START "" "!BROWSER_EXE!" --app="http://127.0.0.1:4000" --window-size=1280,800
) ELSE (
    START "" "http://127.0.0.1:4000"
)
ENDLOCAL
EXIT /B 0
`;
  fs.writeFileSync(path.join(outputDir, 'start-server.bat'), startBatContent, 'utf-8');

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

  // README
  const readmeContent = `# Shop Inventory & Cashflow System - ${buildType.toUpperCase()} Edition

- **Build Type**: \`${buildType}\`
- **Telemetry & Debugging**: ${isDebug ? 'Included and Enabled' : 'Completely Excluded / Stripped'}
`;
  fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent, 'utf-8');

  // Zip Archive
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }
  const cacheDir = path.join(outputDir, 'server', 'node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    } catch (e) {}
  }
  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -A 'System.IO.Compression.FileSystem'; [System.IO.Compression.ZipFile]::CreateFromDirectory('${outputDir}', '${zipFilePath}')"`, { stdio: 'inherit' });
    console.log(`Successfully created archive via .NET ZipFile: ${zipFilePath}`);
  } catch (err) {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${outputDir}' -DestinationPath '${zipFilePath}' -Force"`, { stdio: 'inherit' });
    console.log(`Successfully created archive via PowerShell Compress-Archive: ${zipFilePath}`);
  }
}

function main() {
  console.log('=== Building Dual Artifacts (Debug & Released) ===');
  buildArtifact('debug');
  buildArtifact('release');
  console.log('\n=== Both Debug and Released Artifacts successfully generated in dist-portable/ ===');
}

main();
