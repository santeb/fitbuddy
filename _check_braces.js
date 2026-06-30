const fs = require('fs');
const js = fs.readFileSync('F:/workbuddy/fitness-app/_check.js', 'utf8');
const lines = js.split('\n');
let depth = 0;
let inString = false;
let strChar = '';
let inComment = false;
let inBlockComment = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    const next = j < line.length - 1 ? line[j + 1] : '';
    
    // Skip comments
    if (!inString && !inBlockComment && c === '/' && next === '/') break;
    if (!inString && c === '/' && next === '*') { inBlockComment = true; j++; continue; }
    if (inBlockComment && c === '*' && next === '/') { inBlockComment = false; j++; continue; }
    if (inBlockComment) continue;
    
    // Handle strings
    if (!inString && (c === '"' || c === "'" || c === '`')) {
      inString = true;
      strChar = c;
      continue;
    }
    if (inString && c === strChar) {
      // Check for escape
      let escaped = false;
      let k = j - 1;
      while (k >= 0 && line[k] === '\\') { escaped = !escaped; k--; }
      if (!escaped) inString = false;
      continue;
    }
    if (inString) continue;
    
    // Count braces
    if (c === '{') depth++;
    if (c === '}') {
      depth--;
      if (depth < 0) {
        console.log('EXTRA } at line', i + 1, ':', line.trim());
        process.exit(1);
      }
    }
  }
}

if (depth > 0) {
  console.log('Missing', depth, 'closing braces');
} else {
  console.log('Braces balanced OK');
}
