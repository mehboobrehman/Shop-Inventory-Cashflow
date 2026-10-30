const https = require('https');
const fs = require('fs');
const token = process.env.GITHUB_TOKEN || '';
const releaseId = '428731681';

const files = [
  { name: 'ShopInventory-Portable.zip', filePath: 'dist-portable/ShopInventory-Portable.zip' },
  { name: 'ShopInventory-Mobile-Companion-v1.1.2.apk', filePath: 'dist-portable/ShopInventory-Mobile-Companion-v1.1.2.apk' }
];

files.forEach(f => {
  if (!fs.existsSync(f.filePath)) {
    console.log('File not found:', f.filePath);
    return;
  }
  const stats = fs.statSync(f.filePath);
  const fileBuffer = fs.readFileSync(f.filePath);

  const reqOptions = {
    hostname: 'uploads.github.com',
    path: `/repos/mehboobrehman/Shop-Inventory-Cashflow/releases/${releaseId}/assets?name=` + encodeURIComponent(f.name),
    method: 'POST',
    headers: {
      'Authorization': 'token ' + token,
      'User-Agent': 'NodeJS-Release-Script',
      'Content-Type': 'application/zip',
      'Content-Length': stats.size
    }
  };

  const req = https.request(reqOptions, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Uploaded ' + f.name + ' -> Status:', res.statusCode, body);
    });
  });

  req.on('error', e => console.error('Error uploading ' + f.name + ':', e));
  req.write(fileBuffer);
  req.end();
});
