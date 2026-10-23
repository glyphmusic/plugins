#!/usr/bin/env node
// Checks glyph-plugin.json files with the rules Glyph uses, shows a
// theme's colours in the terminal and, for local files of extensions, checks
// the code (`main`) next to the manifest. For plugin makers, before
// publishing:
//
//   node validate.mjs                          ./glyph-plugin.json
//   node validate.mjs path/to/glyph-plugin.json themes/*/glyph-plugin.json
//   node validate.mjs https://raw.githubusercontent.com/you/repo/HEAD/glyph-plugin.json
//
// Without a clone of this repo (needs manifest.mjs next to it):
//   curl -fsSLO https://raw.githubusercontent.com/glyphmusic/plugins/main/scripts/manifest.mjs
//   curl -fsSLO https://raw.githubusercontent.com/glyphmusic/plugins/main/scripts/validate.mjs
//   node validate.mjs
//
// Exit code 1 when any file has a problem. No dependencies: Node 20+.

import {readFileSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {MANIFEST, validate, hexValue, checkCode} from './manifest.mjs';

const files = process.argv.slice(2);
if (!files.length) files.push(MANIFEST);

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const swatch = (hex) => {
  const v = hexValue(hex);
  const block = color ? `\x1b[48;2;${v >> 16};${(v >> 8) & 255};${v & 255}m    \x1b[0m ` : '';
  return `${block}${hex}`;
};

async function read(file) {
  if (/^https?:\/\//.test(file)) {
    const r = await fetch(file, {headers: {'user-agent': 'glyph-plugin-validate'}});
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  }
  return readFileSync(file, 'utf8');
}

let failed = 0;
for (const file of files) {
  let manifest;
  try {
    manifest = JSON.parse(await read(file));
  } catch (e) {
    console.log(`✗ ${file}\n  - cannot read it as JSON: ${e.message}`);
    failed++;
    continue;
  }
  const problems = validate(manifest);
  // The code next to a local manifest (URLs: the index CI checks it).
  if (!problems.length && manifest.main && !/^https?:\/\//.test(file)) {
    const code = join(dirname(file), manifest.main);
    if (!existsSync(code)) problems.push(`main: ${code} does not exist (build the plugin first)`);
    else {
      const p = checkCode(readFileSync(code));
      if (p) problems.push(`main: ${p}`);
    }
  }
  if (problems.length) {
    console.log(`✗ ${file}`);
    for (const p of problems) console.log(`  - ${p}`);
    failed++;
    continue;
  }
  console.log(`✓ ${file}: ${manifest.name} ${manifest.version} (id ${manifest.id}, ${manifest.kind})`);
  if (manifest.theme) {
    const t = manifest.theme;
    console.log(`  accent  ${swatch(t.accent)}`);
    if (t.glow) console.log(`  glow    ${t.glow.map(swatch).join('  ')}`);
    else console.log('  glow    (none: each view uses its own colours)');
    console.log(`  base    ${t.base ? swatch(t.base) : '(default #030303)'}`);
  }
  if (manifest.kind === 'extension') {
    const list = (label, items) => items?.length && console.log(`  ${label.padEnd(12)}${items.join(', ')}`);
    if (manifest.main) console.log(`  code        ${manifest.main}`);
    list('permissions', manifest.permissions);
    list('network', manifest.network);
    list('settings', manifest.settings?.map(s => `${s.id} (${s.page ?? 'own'}, ${s.items.length} items)`));
    list('menus', manifest.menus?.map(m => m.id));
    if (manifest.strings) list('texts', Object.entries(manifest.strings).map(([l, t]) => `${l}: ${Object.keys(t).length}`));
    list('hides', manifest.hide);
  }
}
if (failed) {
  console.log(`\n${failed} of ${files.length} file(s) have problems.`);
  process.exit(1);
}
