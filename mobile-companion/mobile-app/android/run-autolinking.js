const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = 'C:\\Users\\mehboob.rehman\\OneDrive - National Foods Limited\\AI\\autodesk\\Autodeskprojects\\shop-inventory-cashflow\\mobile-companion\\mobile-app';
process.chdir(projectRoot);

const scriptPath = path.join(projectRoot, 'node_modules', 'expo-modules-autolinking', 'bin', 'expo-modules-autolinking.js');
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [scriptPath, ...args], { encoding: 'utf8' });

fs.writeFileSync(path.join(projectRoot, 'android', 'autolinking-log.txt'), JSON.stringify({
  status: result.status,
  stdout: result.stdout,
  stderr: result.stderr,
  args
}, null, 2));

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}
process.exit(result.status ?? 1);
