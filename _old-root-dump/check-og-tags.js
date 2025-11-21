const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'build', 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('Build not found. Run build first.');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf-8');

let failed = false;

// Check for required tags
const requiredChecks = [
  { pattern: /<meta property="og:title" content="([^"]*)"/, expected: 'Grok One-Shot', name: 'og:title' },
  { pattern: /<meta property="og:description" content="([^"]*)"/, expected: 'Claude Code-level intelligence in your terminal', name: 'og:description' },
  { pattern: /<meta property="og:image" content="([^"]*)"/, expected: 'https://grok-one-shot.org/img/logo.png', name: 'og:image' },
  { pattern: /<meta name="twitter:card" content="([^"]*)"/, expected: 'summary_large_image', name: 'twitter:card' },
];

for (const check of requiredChecks) {
  const match = html.match(check.pattern);
  if (!match) {
    console.error(`Missing tag: ${check.name}`);
    failed = true;
  } else if (match[1] !== check.expected) {
    console.error(`Incorrect ${check.name}: got "${match[1]}", expected "${check.expected}"`);
    failed = true;
  }
}

// Additional checks
// Check if og:title or og:description contains "Docusaurus"
const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]*)"/);
if (ogTitleMatch && ogTitleMatch[1].includes('Docusaurus')) {
  console.error('og:title contains "Docusaurus"');
  failed = true;
}

const ogDescMatch = html.match(/<meta property="og:description" content="([^"]*)"/);
if (ogDescMatch && ogDescMatch[1].includes('Docusaurus')) {
  console.error('og:description contains "Docusaurus"');
  failed = true;
}

// Check og:image is absolute HTTPS
const ogImageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
if (ogImageMatch && !ogImageMatch[1].startsWith('https://')) {
  console.error('og:image is not an absolute HTTPS URL');
  failed = true;
}

// Optional warnings
if (ogTitleMatch && ogTitleMatch[1].length > 60) {
  console.warn(`og:title is ${ogTitleMatch[1].length} characters, recommended <= 60`);
}

if (ogDescMatch && ogDescMatch[1].length > 160) {
  console.warn(`og:description is ${ogDescMatch[1].length} characters, recommended <= 160`);
}

if (failed) {
  console.error('OG tags validation failed');
  process.exit(1);
} else {
  console.log('OG tags validation passed');
}