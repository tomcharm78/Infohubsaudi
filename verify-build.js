// Run this to verify the code is correct before pushing to GitHub
// Usage: node verify-build.js

const fs = require('fs');
const path = require('path');

let errors = 0;

// Check 1: No JSX fragments
const componentDir = path.join(__dirname, 'app', 'components');
const files = [
  path.join(__dirname, 'app', 'page.js'),
  ...fs.readdirSync(componentDir).filter(f => f.endsWith('.js')).map(f => path.join(componentDir, f))
];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const fragments = (content.match(/<>|<\/>/g) || []).length;
  if (fragments > 0) {
    console.log('❌ FRAGMENTS in ' + path.basename(f) + ': ' + fragments);
    errors++;
  }
  
  // Check for <style>{ in JSX
  const styleInJsx = (content.match(/<style>\{/g) || []).length;
  if (styleInJsx > 0) {
    console.log('❌ INLINE STYLE in ' + path.basename(f) + ': ' + styleInJsx);
    errors++;
  }
}

// Check 2: Next.js version
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
console.log('Next.js version: ' + pkg.dependencies.next);

// Check 3: page.js line count
const pageJs = fs.readFileSync(path.join(__dirname, 'app', 'page.js'), 'utf8');
const lineCount = pageJs.split('\n').length;
console.log('page.js lines: ' + lineCount);
if (lineCount > 385) {
  console.log('⚠️  page.js has too many lines - might be old version');
}

// Check 4: globals.css has animations
const css = fs.readFileSync(path.join(__dirname, 'app', 'globals.css'), 'utf8');
const hasTickerAnim = css.includes('@keyframes ticker');
const hasBlinkAnim = css.includes('@keyframes blink');
const hasPulseAnim = css.includes('@keyframes pulse');
const hasLeaflet = css.includes('.leaflet-container');
console.log('globals.css animations: ticker=' + hasTickerAnim + ' blink=' + hasBlinkAnim + ' pulse=' + hasPulseAnim + ' leaflet=' + hasLeaflet);

if (errors === 0) {
  console.log('\n✅ ALL CHECKS PASSED — safe to push to GitHub');
} else {
  console.log('\n❌ ' + errors + ' ERRORS FOUND — do NOT push until fixed');
}
