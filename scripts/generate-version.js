const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

function syncAndroidVersion() {
  const gradlePath = path.join(rootDir, 'mobile-companion', 'mobile-app', 'android', 'app', 'build.gradle');
  const pkgPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(gradlePath) || !fs.existsSync(pkgPath)) return;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const versionStr = pkg.version || '1.0.0';
    const parts = versionStr.split('.').map(Number);
    const major = parts[0] || 1;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    const versionCode = major * 10000 + minor * 100 + patch;

    let gradleContent = fs.readFileSync(gradlePath, 'utf-8');
    gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
    gradleContent = gradleContent.replace(/versionName\s+"[^"]+"/, `versionName "${versionStr}"`);
    fs.writeFileSync(gradlePath, gradleContent, 'utf-8');
    console.log(`Synchronized version into Android build.gradle: versionName "${versionStr}", versionCode ${versionCode}`);
  } catch (err) {
    console.warn('Warning: Failed to sync version into Android build.gradle:', err.message);
  }
}

function generateVersionInfo() {
  const rootDir = path.resolve(__dirname, '..');

  // Synchronize version into Android build.gradle
  syncAndroidVersion();
  
  // 1. Read package.json version
  let version = '1.0.0';
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
    version = pkg.version || '1.0.0';
  } catch (err) {
    console.warn('Warning: Could not read package.json version, using fallback 1.0.0');
  }

  // 2. Get Git commit hash
  let commitHash = 'unknown';
  try {
    commitHash = execSync('git rev-parse --short HEAD', { cwd: rootDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (err) {
    commitHash = process.env.GIT_COMMIT_HASH || 'dev';
  }

  // 3. Get timestamp
  const buildTimestamp = process.env.BUILD_TIMESTAMP || new Date().toISOString();

  // 4. Get environment
  const environment = process.env.NODE_ENV || 'development';

  // 5. Construct build string (e.g. 1.0.0+build.a1b2c3d)
  const build = `${version}+build.${commitHash}`;

  const versionInfo = {
    version,
    build,
    commitHash,
    buildTimestamp,
    environment
  };

  const jsonContent = JSON.stringify(versionInfo, null, 2);

  // Write files
  // Root version.json
  try {
    fs.writeFileSync(path.join(rootDir, 'version.json'), jsonContent, 'utf-8');
    console.log('Generated root version.json');
  } catch (err) {
    console.error('Failed to write root version.json:', err.message);
  }

  // client/public/version.json
  const publicDir = path.join(rootDir, 'client', 'public');
  try {
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, 'version.json'), jsonContent, 'utf-8');
    console.log('Generated client/public/version.json');
  } catch (err) {
    console.error('Failed to write client/public/version.json:', err.message);
  }

  // client/dist/version.json if dist folder exists
  const distDir = path.join(rootDir, 'client', 'dist');
  try {
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, 'version.json'), jsonContent, 'utf-8');
      console.log('Generated client/dist/version.json');
    }
  } catch (err) {
    console.error('Failed to write client/dist/version.json:', err.message);
  }

  return versionInfo;
}

if (require.main === module) {
  generateVersionInfo();
}

module.exports = { generateVersionInfo };
