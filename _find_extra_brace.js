const fs = require('fs');
const html = fs.readFileSync('F:/workbuddy/fitness-app/index.html', 'utf8');

// Find the first <script> block
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.log('No script block found'); process.exit(); }

const js = scriptMatch[1];
const scriptStart = html.indexOf('<script>') + '<script>'.length;

// Find doGenerate function
const funcIdx = js.indexOf('function doGenerate()');
if (funcIdx < 0) { console.log('doGenerate not found'); process.exit(); }

// Count braces to find function end
let braceCount = 0;
let inString = false;
let strChar = '';
let endDate = -1;
let extraBraceLine = -1;

const lines = js.split('\n');
let globalLine = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    const next = j < line.length - 1 ? line[j + 1] : '';
    
    // Skip strings
    if (!inString && (c === '"' || c === "'" || c === '`')) {
      inString = true;
      strChar = c;
      continue;
    }
    if (inString && c === strChar) {
      let escaped = false;
      let k = j - 1;
      while (k >= 0 && line[k] === '\\') { escaped = !escaped; k--; }
      if (!escaped) inString = false;
      continue;
    }
    if (inString) continue;
    
    // Skip comments
    if (c === '/' && next === '/') break;
    if (c === '/' && next === '*') { j++; continue; }
    
    if (c === '{') braceCount++;
    if (c === '}') {
      braceCount--;
      if (braceCount < 0) {
        console.log('EXTRA } at line', i + 1, ':', line.trim());
        extraBraceLine = i + 1;
        break;
      }
    }
  }
  if (extraBraceLine >= 0) break;
}

if (extraBraceLine >= 0) {
  console.log('Extra brace found at line', extraBraceLine, 'in the script block');
  console.log('This corresponds to approximately line', extraBraceLine + html.substring(0, scriptStart).split('\n').length, 'in index.html');
} else {
  console.log('No extra brace found, braceCount=', braceCount);
}
