#!/usr/bin/env node
/**
 * Build script: Injects Vercel env vars into HTML, outputs to public/
 * Reads: GH_OWNER, GH_REPO, GH_TOKEN, GH_BRANCH, GH_PATH from process.env
 * Writes: public/index.html (ready to serve)
 * No user config needed - token auto-loaded from env vars
 */

const fs = require('fs');
const path = require('path');

const owner = process.env.GH_OWNER || 'YOUR_GITHUB_USERNAME';
const repo = process.env.GH_REPO || 'YOUR_DATA_REPO_NAME';
const token = process.env.GH_TOKEN || '';
const branch = process.env.GH_BRANCH || 'main';
const ghPath = process.env.GH_PATH || 'expenses';

console.log('\n🔨 BUILD STARTING\n');
console.log(`  GH_OWNER: ${owner}`);
console.log(`  GH_REPO: ${repo}`);
console.log(`  GH_TOKEN: ${token ? '(set - ' + token.length + ' chars)' : '(NOT SET)'}`);
console.log(`  GH_BRANCH: ${branch}`);
console.log(`  GH_PATH: ${ghPath}\n`);

// Find HTML file
let htmlPath = path.join(__dirname, 'index.html');
if (!fs.existsSync(htmlPath)) {
  const alt = path.join(__dirname, 'daily-tracker.html');
  if (fs.existsSync(alt)) {
    htmlPath = alt;
    console.log('  ⚠ Using daily-tracker.html\n');
  } else {
    console.error('❌ ERROR: No index.html or daily-tracker.html found\n');
    process.exit(1);
  }
}

try {
  let html = fs.readFileSync(htmlPath, 'utf8');
  console.log(`  ✓ Read HTML (${(html.length / 1024).toFixed(1)} KB)`);

  // 1. Replace DEFAULTS object values (simple string replacement)
  html = html.replace(
    /const DEFAULTS=\{[\s\S]*?\}/,
    `const DEFAULTS={
  owner : '${owner}',
  repo  : '${repo}',
  branch: '${branch}',
  path  : '${ghPath}'
}`
  );
  console.log('  ✓ Updated DEFAULTS');

  // 2. Replace _envToken value (matches empty string with flexible spacing)
  const beforeReplace = html;
  html = html.replace(
    /const _envToken\s*=\s*'';/,
    `const _envToken='${token}';`
  );
  
  if (html === beforeReplace) {
    console.error('  ⚠️  WARNING: Token pattern not found! Regex did not match.');
    console.error('  Looking for: const _envToken=\\'\\';');
  } else {
    console.log('  ✓ Injected token');
  }

  // 3. Ensure public dir exists
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 4. Write output
  const outPath = path.join(publicDir, 'index.html');
  fs.writeFileSync(outPath, html);
  console.log(`  ✓ Wrote public/index.html`);

  // 5. Copy login page
  const loginPath = path.join(__dirname, 'login.html');
  if (fs.existsSync(loginPath)) {
    const loginOut = path.join(publicDir, 'login.html');
    fs.copyFileSync(loginPath, loginOut);
    console.log(`  ✓ Copied login.html`);
  }

  // 6. Copy middleware
  const middlewarePath = path.join(__dirname, 'middleware.js');
  if (fs.existsSync(middlewarePath)) {
    const middlewareOut = path.join(__dirname, 'middleware.js'); // stays in root
    console.log(`  ✓ Middleware ready`);
  }

  console.log('');
  console.log('✅ BUILD SUCCESS\n');
  process.exit(0);

} catch (err) {
  console.error(`\n❌ BUILD FAILED\n`);
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
}
