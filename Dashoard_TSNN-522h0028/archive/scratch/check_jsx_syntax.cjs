const fs = require('fs');
const path = require('path');

function checkFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  let openBraces = 0;
  let openParens = 0;
  let openBrackets = 0;
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let inLineComment = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inComment) {
      if (c === '*' && next === '/') {
        inComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (c === '\\') {
        i++; // skip escaped char
        continue;
      }
      if (c === stringChar) {
        inString = false;
      }
      continue;
    }

    // Check comments
    if (c === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      inComment = true;
      i++;
      continue;
    }

    // Check strings
    if (c === '"' || c === "'" || c === '`') {
      inString = true;
      stringChar = c;
      continue;
    }

    if (c === '{') openBraces++;
    else if (c === '}') openBraces--;
    else if (c === '(') openParens++;
    else if (c === ')') openParens--;
    else if (c === '[') openBrackets++;
    else if (c === ']') openBrackets--;

    if (openBraces < 0 || openParens < 0 || openBrackets < 0) {
      return { ok: false, error: `Negative count at char ${i} (${c})` };
    }
  }

  if (openBraces !== 0 || openParens !== 0 || openBrackets !== 0 || inString || inComment) {
    return {
      ok: false,
      error: `Unbalanced: braces=${openBraces}, parens=${openParens}, brackets=${openBrackets}, inString=${inString}, inComment=${inComment}`
    };
  }
  return { ok: true };
}

function scanDir(dir) {
  let count = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      count += scanDir(p);
    } else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      const res = checkFile(p);
      if (!res.ok) {
        console.error(`✗ Syntax error in ${p}: ${res.error}`);
        process.exit(1);
      } else {
        console.log(`✓ OK: ${f}`);
        count++;
      }
    }
  }
  return count;
}

console.log('Scanning all JS/JSX files in frontend/src:');
const total = scanDir('TDTU_DB_CNTT_System/frontend/src');
console.log(`\n🎉 All ${total} files have perfectly balanced syntax!`);
