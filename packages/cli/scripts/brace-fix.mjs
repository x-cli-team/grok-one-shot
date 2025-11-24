// scripts/brace-fix.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/brace-fix.mjs <file1> <file2> ...');
  process.exit(1);
}

for (const f of files) {
  const p = resolve(f);
  const src = readFileSync(p, 'utf8').split('\n');
  let depth = 0;
  const out = [];
  for (let i = 0; i < src.length; i++) {
    const line = src[i];
    const trimmed = line.trim();

    // Decide if this line is a naked closing brace at top-level start
    const isNakedCloser =
      (trimmed === '}' || trimmed === '};') && depth === 0 && i < 50;

    if (isNakedCloser) {
      // skip it
      continue;
    }

    // naive depth tracking (good enough for top-of-file cleanup)
    // we avoid counting braces inside quotes/backticks to reduce false hits
    let inS = false, inD = false, inB = false, esc = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (!inD && !inB && ch === "'" && !esc) inS = !inS;
      else if (!inS && !inB && ch === '"' && !esc) inD = !inD;
      else if (!inS && !inD && ch === '`' && !esc) inB = !inB;
      else if (!inS && !inD && !inB) {
        if (ch === '{') depth++;
        if (ch === '}') depth = Math.max(0, depth - 1);
      }
      esc = ch === '\\' && !esc;
    }

    out.push(line);
  }
  writeFileSync(p, out.join('\n'), 'utf8');
  console.log('Fixed:', p);
}