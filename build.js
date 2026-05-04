#!/usr/bin/env node
/**
 * Build script: injects Vercel env vars into HTML at deploy time
 * Looks for index.html or daily-tracker.html, injects env vars, outputs to public/index.html
 */

const fs = require('fs');
const path = require('path');

// Read env vars from Vercel
const owner = process.env.GH_OWNER || 'YOUR_GITHUB_USERNAME';
const repo = process.env.GH_REPO || 'YOUR_DATA_REPO_NAME';
const token = process.env.GH_TOKEN || '';
const branch = process.env.GH_BRANCH || 'main';
const ghPath = process.env.GH_PATH || 'expenses';

console.log('🔨 Building...');
console.log(`  GH_OWNER: ${owner}`);
console.log(`  GH_REPO: ${repo}`);
console.log(`  GH_TOKEN: ${token ? '***' : '(empty)'}`);

// Find HTML file - try index.html first, then daily-tracker.html
let htmlPath = path.join(__dirname, 'index.html');
let htmlSource = 'index.html';

if (!fs.existsSync(htmlPath)) {
  const alt = path.join(__dirname, 'daily-tracker.html');
  if (fs.existsSync(alt)) {
    htmlPath = alt;
    htmlSource = 'daily-tracker.html';
    console.log(`  ⚠ index.html not found, using ${htmlSource}`);
  } else {
    console.error('❌ ERROR: Neither index.html nor daily-tracker.html found in repo root');
    console.error('   Make sure you have renamed daily-tracker.html to index.html');
    process.exit(1);
  }
}

try {
  // Read HTML
  let html = fs.readFileSync(htmlPath, 'utf8');
  console.log(`  ✓ Read ${htmlSource} (${(html.length / 1024).toFixed(1)} KB)`);

  // Replace DEFAULTS block
  const replacement = `const DEFAULTS={
  owner : '${owner}',
  repo  : '${repo}',
  branch: '${branch}',
  path  : '${ghPath}'
};
// TOKEN injected from Vercel env: GH_TOKEN
const _envToken = '${token}';`;

  // Match the block from "const DEFAULTS=" to the closing "}" and beyond
  const pattern = /const DEFAULTS=\{[^}]*\};[\s\S]*?const _envToken\s*=\s*['""]['""];?/;
  const matched = html.match(pattern);
  
  if (!matched) {
    console.error('❌ ERROR: Could not find DEFAULTS block in HTML');
    console.error('   Make sure you\'re using the updated daily-tracker.html file');
    process.exit(1);
  }

  html = html.replace(pattern, replacement);
  console.log(`  ✓ Injected env vars into DEFAULTS`);

  // Ensure public dir exists
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log(`  ✓ Created public/`);
  }

  // Write to public/index.html
  const outPath = path.join(publicDir, 'index.html');
  fs.writeFileSync(outPath, html);
  console.log(`  ✓ Wrote public/index.html`);

  console.log('\n✅ Build complete!\n');
  
} catch (err) {
  console.error('❌ Build failed:', err.message);
  console.error(err.stack);
  process.exit(1);
}
