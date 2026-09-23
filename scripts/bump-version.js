const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packages = [
  { name: 'root', path: path.join(rootDir, 'package.json') },
  { name: 'server', path: path.join(rootDir, 'server', 'package.json') },
  { name: 'client', path: path.join(rootDir, 'client', 'package.json') },
  { name: 'shared', path: path.join(rootDir, 'shared', 'package.json') }
];

function getLatestVersion() {
  const rootPkg = JSON.parse(fs.readFileSync(packages[0].path, 'utf-8'));
  return rootPkg.version || '1.0.0';
}

function bumpVersion(type = 'patch') {
  const currentVersion = getLatestVersion();
  const parts = currentVersion.split('.').map(Number);
  let [major, minor, patch] = parts;

  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  const newVersion = `${major}.${minor}.${patch}`;
  console.log(`Bumping version from ${currentVersion} to ${newVersion} (${type}) across monorepo packages...`);

  for (const pkg of packages) {
    if (!fs.existsSync(pkg.path)) {
      console.warn(`Warning: package.json not found at ${pkg.path}`);
      continue;
    }
    const content = JSON.parse(fs.readFileSync(pkg.path, 'utf-8'));
    content.version = newVersion;
    fs.writeFileSync(pkg.path, JSON.stringify(content, null, 2) + '\n', 'utf-8');
    console.log(`Updated ${pkg.name}/package.json version to ${newVersion}`);
  }

  return newVersion;
}

function getRecentCommits(limit = 20) {
  try {
    const log = execSync(`git log -n ${limit} --pretty=format:"%h|%an|%s|%ad" --date=short`, { cwd: rootDir }).toString().trim();
    if (!log) return [];
    return log.split('\n').map(line => {
      const [hash, author, message, date] = line.split('|');
      return { hash, author, message, date };
    });
  } catch (err) {
    console.warn('Warning: Could not retrieve git commits (git repository might be uninitialized or non-git).');
    return [];
  }
}

function generateChangelog(newVersion) {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  const commits = getRecentCommits(30);

  const features = [];
  const fixes = [];
  const others = [];

  for (const c of commits) {
    const msg = c.message.toLowerCase();
    if (msg.startsWith('feat') || msg.includes('add') || msg.includes('implement')) {
      features.push(c);
    } else if (msg.startsWith('fix') || msg.includes('bug') || msg.includes('resolve')) {
      fixes.push(c);
    } else {
      others.push(c);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  let section = `## [${newVersion}] - ${today}\n\n`;
  if (features.length > 0) {
    section += `### Features\n`;
    for (const f of features) {
      section += `- ${f.message} (${f.hash})\n`;
    }
    section += `\n`;
  }
  if (fixes.length > 0) {
    section += `### Bug Fixes\n`;
    for (const fx of fixes) {
      section += `- ${fx.message} (${fx.hash})\n`;
    }
    section += `\n`;
  }
  if (others.length > 0 && features.length === 0 && fixes.length === 0) {
    section += `### Changes\n`;
    for (const o of others.slice(0, 10)) {
      section += `- ${o.message} (${o.hash})\n`;
    }
    section += `\n`;
  }

  let existingContent = '';
  if (fs.existsSync(changelogPath)) {
    existingContent = fs.readFileSync(changelogPath, 'utf-8');
  } else {
    existingContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n`;
  }

  // Insert new section right after the header
  const headerMarker = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  let newChangelog = '';
  if (existingContent.startsWith('# Changelog')) {
    const rest = existingContent.slice(headerMarker.length);
    newChangelog = headerMarker + section + (rest ? '\n' + rest : '');
  } else {
    newChangelog = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n` + section + existingContent;
  }

  fs.writeFileSync(changelogPath, newChangelog, 'utf-8');
  console.log('Updated CHANGELOG.md successfully.');
}

function runRelease(type = 'patch') {
  const newVersion = bumpVersion(type);
  generateChangelog(newVersion);

  // Also update version.json via generate-version.js if present
  try {
    const { generateVersionInfo } = require('./generate-version.js');
    if (typeof generateVersionInfo === 'function') {
      generateVersionInfo();
    }
  } catch (e) {
    console.warn('Notice: generate-version.js execution skipped:', e.message);
  }

  console.log(`\n=== Release version ${newVersion} prepared successfully! ===`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  let type = 'patch';
  if (args.includes('minor') || args.includes('--minor')) type = 'minor';
  if (args.includes('major') || args.includes('--major')) type = 'major';
  if (args.includes('patch') || args.includes('--patch')) type = 'patch';

  runRelease(type);
}

module.exports = { bumpVersion, generateChangelog, runRelease };
