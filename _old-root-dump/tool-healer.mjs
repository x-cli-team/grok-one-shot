// scripts/tool-healer.mjs
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sh = (cmd, opts={}) =>
  execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });

const run = (cmd, allowFail=false) => {
  try { return { ok: true, out: sh(cmd) }; }
  catch (e) { if (allowFail) return { ok: false, out: e.stdout || String(e) }; throw e; }
};

// 1) Typecheck first (syntax gate)
let tc = run('pnpm -s tsc --noEmit --pretty false', true);
if (!tc.ok) {
  // Detect early "Unexpected }"/top-of-file brace issues and attempt conservative repair
  const lines = (tc.out || '').split('\n');
  const files = Array.from(
    new Set(lines
      .map(l => (l.match(/^(.*\.ts)\((\d+),\d+\): error TS.*(Unexpected|'}' expected)/i) || [])[1])
      .filter(Boolean))
  );

  for (const f of files) {
    const p = resolve(f);
    const src = readFileSync(p, 'utf8').split('\n');
    // Remove only solitary '}' or '};' within first 40 lines AND only if we have not seen '{' yet.
    let depth = 0;
    const out = [];
    for (let i = 0; i < src.length; i++) {
      const line = src[i];
      if (i < 40 && depth === 0 && /^\s*}\s*;?\s*$/.test(line)) continue;
      // naive depth tracking ignoring strings (good enough for header zone)
      for (const ch of line) {
        if (ch === '{') depth++;
        else if (ch === '}') depth = Math.max(0, depth - 1);
      }
      out.push(line);
    }
    writeFileSync(p, out.join('\n'), 'utf8');
    console.log('[brace-fix] cleaned:', f);
  }
  // Re-run typecheck after conservative brace cleanup
  tc = run('pnpm -s tsc --noEmit --pretty false', true);
  if (!tc.ok) {
    console.error(tc.out);
    process.exitCode = 1;
    console.error('[healer] Typecheck still failing; manual review needed.');
    process.exit(1);
  }
}

// 2) ESLint auto-fix + Prettier
run('pnpm -s eslint "{tools,src}/**/*.{ts,tsx}" --fix', true);
run('pnpm -s prettier --write "{tools,src}/**/*.{ts,tsx,md,json}"', true);

// 3) Enforce critical patterns (fs imports, node: protocol)
// Fail build if any remain; agent can run a codemod if desired.
const grepFs = run(`rg -n "from 'fs'|from \\"fs\\"" tools`, true);
if (!grepFs.ok && grepFs.out) {
  console.error('[healer] forbidden fs import still present:\n', grepFs.out);
  process.exit(1);
}

// 4) Build in debug (no bundle), then Node bundle
let build = run('pnpm -s tsup --config tsup.debug.config.ts', true);
if (!build.ok) {
  console.error(build.out);
  process.exit(1);
}
build = run('pnpm -s tsup --config tsup.node.config.ts', true);
if (!build.ok) {
  console.error(build.out);
  process.exit(1);
}

// 5) Smoke-run core tools (adjust to your actual entrypoints)
for (const cmd of [
  'node dist/tools/text-editor.js --selftest',
  'node dist/tools/intelligence/code-context.js --selftest',
  'node dist/tools/view_file.js --selftest'
]) {
  const res = run(cmd, true);
  if (!res.ok) { console.error('[healer] smoke failed:', cmd, '\n', res.out); process.exit(1); }
}

// 6) If we got here, commit on a branch so CI can publish
run('git checkout -B fix/tools-auto-heal', true);
run('git add -A', true);
run('git commit -m "chore(healer): auto-fix lint/syntax; rebuild tools" --allow-empty', true);
console.log('[healer] Ready to push: git push -u origin fix/tools-auto-heal');