#!/usr/bin/env node
/**
 * Build script: injects Vercel env vars into HTML DEFAULTS
 * Run: node build.js
 * Reads: process.env (GH_OWNER, GH_REPO, GH_TOKEN, GH_BRANCH, GH_PATH)
 * Writes: public/index.html
 */

const fs = require('fs');
const path = require('path');

// Read env vars from Vercel (or local .env)
const owner = process.env.GH_OWNER || 'YOUR_GITHUB_USERNAME';
const repo = process.env.GH_REPO || 'YOUR_DATA_REPO_NAME';
const token = process.env.GH_TOKEN || '';
const branch = process.env.GH_BRANCH || 'main';
const ghPath = process.env.GH_PATH || 'expenses';

// Read HTML
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace DEFAULTS block
const replacement = `const DEFAULTS={
  owner : '${owner}',
  repo  : '${repo}',
  branch: '${branch}',
  path  : '${ghPath}'
};
// TOKEN injected from Vercel env: GH_TOKEN
const _envToken = '${token}';`;

// Match the block from "const DEFAULTS=" to the closing "}"
const pattern = /const DEFAULTS=\{[^}]*\};[\s\S]*?\/\/ TOKEN:[^\n]*/;
html = html.replace(pattern, replacement);

// Inject token into CFG initialization if env var exists
if (token) {
  const cfgPattern = /let CFG=\{[\s\S]*?token\s*:\s*_saved\.token\s*\|\|\s*'',/;
  html = html.replace(cfgPattern, 
    (match) => match.replace("_saved.token || ''", "_envToken || _saved.token || ''")
  );
}

// Ensure public dir exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write to public/index.html
fs.writeFileSync(path.join(publicDir, 'index.html'), html);
console.log('✓ Built. Injected env vars:');
console.log(`  owner=${owner}`);
console.log(`  repo=${repo}`);
console.log(`  branch=${branch}`);
console.log(`  path=${ghPath}`);
console.log(`  token=${token ? '***' : '(empty - enter via Config tab)'}`);
