import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Execute version generator script
try {
  const scriptPath = path.resolve(__dirname, '../scripts/generate-version.js');
  execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('Failed to run version generation script:', err);
}

// Read version.json to get exact values for define injection
let versionInfo = {
  version: '1.0.0',
  build: '1.0.0+build.dev',
  commitHash: 'dev',
  buildTimestamp: new Date().toISOString(),
  environment: 'development'
};

try {
  const versionPath = path.resolve(__dirname, 'public/version.json');
  if (fs.existsSync(versionPath)) {
    versionInfo = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
  }
} catch (err) {
  console.error('Failed to read version.json for injection:', err);
}

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(versionInfo.version),
    __GIT_COMMIT_HASH__: JSON.stringify(versionInfo.commitHash),
    __BUILD_TIMESTAMP__: JSON.stringify(versionInfo.buildTimestamp),
    __ENVIRONMENT__: JSON.stringify(versionInfo.environment),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(versionInfo.version),
    'import.meta.env.VITE_GIT_COMMIT_HASH': JSON.stringify(versionInfo.commitHash),
    'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(versionInfo.buildTimestamp),
    'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(versionInfo.environment),
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});

