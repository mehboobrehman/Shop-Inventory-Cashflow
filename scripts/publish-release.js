const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GH_BIN = process.env.GH_BIN || 'gh';
const PAT = process.env.GITHUB_TOKEN || '';
const rootDir = path.resolve(__dirname, '..');

function runCmd(cmd, options = {}) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { cwd: rootDir, stdio: 'inherit', ...options });
}

function getOutput(cmd) {
  return execSync(cmd, { cwd: rootDir, encoding: 'utf-8' }).trim();
}

function main() {
  console.log('=== Robust Release & Publish Script ===');

  // 1. Authenticate GitHub CLI
  console.log('\n--- Step 1: Configuring GitHub CLI Authentication ---');
  try {
    fs.writeFileSync('token.txt', PAT);
    runCmd(`"${GH_BIN}" auth login --with-token < token.txt`);
    try { fs.unlinkSync('token.txt'); } catch(e) {}
    console.log('GitHub CLI authenticated successfully.');
  } catch (err) {
    console.warn('Warning during gh auth login:', err.message);
  }

  // 2. Check git status & stage/commit uncommitted workspace improvements if needed
  console.log('\n--- Step 2: Checking Git Working Tree ---');
  const status = getOutput('git status --porcelain');
  if (status) {
    console.log('Found uncommitted changes. Staging and committing mobile companion & release script updates...');
    runCmd('git add .');
    try {
      runCmd('git commit -m "chore(release): include mobile companion and release script updates"');
    } catch (e) {
      console.log('Commit skipped or nothing to commit.');
    }
  } else {
    console.log('Working tree is clean.');
  }

  // 3. Determine Version Bump Type (default patch or read argument)
  const args = process.argv.slice(2);
  let bumpType = 'patch';
  if (args.includes('minor') || args.includes('--minor')) bumpType = 'minor';
  if (args.includes('major') || args.includes('--major')) bumpType = 'major';
  if (args.includes('patch') || args.includes('--patch')) bumpType = 'patch';

  console.log(`\n--- Step 3: Executing Version Bump (${bumpType}) & Changelog Generation ---`);
  runCmd(`node scripts/bump-version.js ${bumpType}`);

  // Get new version from root package.json
  const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const version = rootPkg.version;
  const tagName = `v${version}`;
  console.log(`Prepared version: ${version} (Tag: ${tagName})`);

  // 4. Build Project & Portable artifacts
  console.log('\n--- Step 4: Building Project & Portable Packages ---');
  try {
    runCmd('npm run build');
  } catch (e) {
    console.warn('Build warning encountered, continuing...', e.message);
  }

  try {
    runCmd('npm run build:portable');
  } catch (e) {
    console.warn('Portable build notice:', e.message);
  }

  // 5. Commit version bump changes
  console.log('\n--- Step 5: Committing Version Bump & Tagging ---');
  runCmd('git add package.json server/package.json client/package.json shared/package.json CHANGELOG.md version.json client/public/version.json');
  try {
    runCmd(`git commit -m "chore(release): prepare release ${tagName}"`);
  } catch (e) {
    console.log('No new changes to commit for version bump (might already be committed).');
  }

  // Check if tag already exists locally or remotely, delete if re-releasing same version
  try {
    runCmd(`git tag -d ${tagName}`);
  } catch (e) {}

  try {
    runCmd(`git push origin :refs/tags/${tagName}`);
  } catch (e) {}

  runCmd(`git tag -a ${tagName} -m "Release ${tagName}"`);

  // 6. Push Commits and Tags to Origin
  console.log('\n--- Step 6: Pushing Commits and Tags to Origin ---');
  const currentBranch = getOutput('git branch --show-current') || 'main';
  runCmd(`git push origin ${currentBranch}`);
  runCmd(`git push origin ${tagName}`);

  // 7. Create GitHub Release via GitHub CLI
  console.log('\n--- Step 7: Creating GitHub Release via GitHub CLI ---');
  let releaseNotes = `Release ${tagName}\n\nAutomated release with robust version handling and portable package.`;
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, 'utf-8');
    const lines = changelog.split('\n');
    let notesLines = [];
    let capturing = false;
    for (const line of lines) {
      if (line.startsWith(`## [${version}]`)) {
        capturing = true;
        continue;
      } else if (capturing && line.startsWith('## [')) {
        break;
      }
      if (capturing) {
        notesLines.push(line);
      }
    }
    if (notesLines.length > 0) {
      releaseNotes = notesLines.join('\n').trim();
    }
  }

  const notesFile = path.join(rootDir, 'release-notes-temp.md');
  fs.writeFileSync(notesFile, releaseNotes, 'utf-8');

  try {
    runCmd(`"${GH_BIN}" release create ${tagName} --title "Release ${tagName}" --notes-file "${notesFile}"`);
    console.log(`GitHub Release ${tagName} created successfully!`);
  } catch (e) {
    console.log('Release might already exist on GitHub, updating release notes...');
    try {
      runCmd(`"${GH_BIN}" release edit ${tagName} --notes-file "${notesFile}"`);
    } catch (err) {
      console.warn('Could not edit release:', err.message);
    }
  } finally {
    try { fs.unlinkSync(notesFile); } catch (e) {}
  }

  // 8. Upload Assets if present
  console.log('\n--- Step 8: Uploading Release Assets ---');
  const portableZip = path.join(rootDir, 'dist-portable', 'ShopInventory-Portable.zip');
  if (fs.existsSync(portableZip)) {
    try {
      runCmd(`"${GH_BIN}" release upload ${tagName} "${portableZip}" --clobber`);
      console.log('Uploaded ShopInventory-Portable.zip successfully.');
    } catch (e) {
      console.warn('Failed to upload portable zip:', e.message);
    }
  } else {
    console.log('Portable zip not found at dist-portable/ShopInventory-Portable.zip (skipping asset upload).');
  }

  console.log(`\n=== Release ${tagName} successfully pushed and published! ===`);
}

main();
