// Builds index.json from plugins/*.json (the list of checked plugins Glyph
// shows). Each entry names a repo, an optional folder and a pinned commit;
// this script fetches the manifest at that commit, checks it with the same
// rules as the app (manifest.mjs, mirroring glyph-core/src/plugins.rs) and
// embeds it. Plugins with code also need their .wasm (`main`) at that
// commit: a WebAssembly module of at most 16 MiB.
//
//   node scripts/build-index.mjs          write index.json
//   node scripts/build-index.mjs --check  only validate (pull requests)
//
// Entries with "repo": "glyphmusic/plugins" and "rev": "self" live in this
// repo; they are read from disk and pinned to the current commit.
//
// When writing, each entry also gets `stars` (the repo's GitHub stars; not
// for plugins in a folder of a shared repo) and `updated` (last push, or the
// folder's last commit here). CI runs this daily so both stay fresh;
// GITHUB_TOKEN raises the API limit.
// No dependencies: Node 20+ (global fetch).

import {readFileSync, writeFileSync, readdirSync, existsSync} from 'node:fs';
import {execSync} from 'node:child_process';

import {MANIFEST, MAX_CODE, checkCode, validate, validRepo, validPath} from './manifest.mjs';

/** Format of index.json itself (not of the manifests inside). */
const INDEX_FORMAT = 1;

const SELF = 'glyphmusic/plugins';
const check = process.argv.includes('--check');
const root = new URL('../', import.meta.url);

function headCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  return execSync('git rev-parse HEAD', {cwd: root}).toString().trim();
}

/** Stars and last push of `repo` from the GitHub API; empty on failure. */
async function repoInfo(repo) {
  const headers = {'user-agent': 'glyph-plugins-index', accept: 'application/vnd.github+json'};
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}`, {headers});
    if (!r.ok) return {};
    const j = await r.json();
    return {stars: j.stargazers_count, updated: j.pushed_at};
  } catch { return {}; }
}

/** Last commit touching `path` in this repo (ISO 8601). */
function lastCommit(path) {
  try { return execSync(`git log -1 --format=%cI -- "${path}"`, {cwd: root}).toString().trim() || undefined; }
  catch { return undefined; }
}

/** Problem with the plugin's code (its `main`) at `rev`, or null. */
async function codeProblem(entry, rev, main) {
  const file = entry.path ? `${entry.path}/${main}` : main;
  let bytes;
  if (entry.repo === SELF && entry.rev === 'self') {
    const local = new URL(file, root);
    if (!existsSync(local)) return `${file} (main) does not exist in this repo`;
    bytes = readFileSync(local);
  } else {
    const url = `https://raw.githubusercontent.com/${entry.repo}/${rev}/${file}`;
    const r = await fetch(url, {headers: {'user-agent': 'glyph-plugins-index'}});
    if (!r.ok) return `${url} (main): HTTP ${r.status}`;
    const len = Number(r.headers.get('content-length') ?? 0);
    if (len > MAX_CODE) return `the code is larger than ${MAX_CODE / 1024 / 1024} MiB`;
    bytes = new Uint8Array(await r.arrayBuffer());
  }
  return checkCode(bytes);
}

async function manifestOf(entry, rev) {
  const file = entry.path ? `${entry.path}/${MANIFEST}` : MANIFEST;
  if (entry.repo === SELF && entry.rev === 'self') {
    const local = new URL(file, root);
    if (!existsSync(local)) throw new Error(`${file} does not exist in this repo`);
    return JSON.parse(readFileSync(local, 'utf8'));
  }
  const url = `https://raw.githubusercontent.com/${entry.repo}/${rev}/${file}`;
  const r = await fetch(url, {headers: {'user-agent': 'glyph-plugins-index'}});
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const text = await r.text();
  if (text.length > 256 * 1024) throw new Error(`${file} is larger than 256 KiB`);
  return JSON.parse(text);
}

const files = readdirSync(new URL('plugins/', root)).filter(f => f.endsWith('.json')).sort();
const problems = [];
const plugins = [];
const ids = new Set();
let self;
for (const f of files) {
  const where = `plugins/${f}`;
  let entry;
  try { entry = JSON.parse(readFileSync(new URL(where, root), 'utf8')); }
  catch (e) { problems.push(`${where}: not valid JSON (${e.message})`); continue; }
  entry.path ??= '';
  const bad = [];
  if (!validRepo(entry.repo)) bad.push('repo must be owner/name');
  if (!validPath(entry.path)) bad.push('path must be a folder inside the repo');
  const isSelf = entry.repo === SELF && entry.rev === 'self';
  if (!isSelf && !/^[0-9a-f]{40}$/.test(entry.rev ?? '')) bad.push('rev must be a full 40-character commit hash');
  const extra = Object.keys(entry).filter(k => !['repo', 'path', 'rev'].includes(k));
  if (extra.length) bad.push(`unknown fields: ${extra.join(', ')}`);
  if (bad.length) { problems.push(...bad.map(b => `${where}: ${b}`)); continue; }
  const rev = isSelf ? (check ? 'self' : (self ??= headCommit())) : entry.rev;
  let manifest;
  try { manifest = await manifestOf(entry, rev); }
  catch (e) { problems.push(`${where}: ${e.message}`); continue; }
  const errs = validate(manifest);
  if (manifest?.id && `${manifest.id}.json` !== f) errs.push(`file must be named ${manifest.id}.json`);
  if (manifest?.id && ids.has(manifest.id)) errs.push(`id ${manifest.id} is used twice`);
  if (!errs.length && manifest.main) {
    const p = await codeProblem(entry, rev, manifest.main);
    if (p) errs.push(p);
  }
  if (errs.length) { problems.push(...errs.map(e => `${where}: ${e}`)); continue; }
  ids.add(manifest.id);
  const out = {repo: entry.repo, path: entry.path, rev, manifest};
  if (!check) {
    if (isSelf) {
      out.updated = lastCommit(entry.path);
    } else {
      const info = await repoInfo(entry.repo);
      if (!entry.path && Number.isInteger(info.stars)) out.stars = info.stars;
      if (info.updated) out.updated = info.updated;
    }
  }
  plugins.push(out);
}

if (problems.length) {
  console.error(problems.map(p => `  - ${p}`).join('\n'));
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}
plugins.sort((a, b) => a.manifest.id.localeCompare(b.manifest.id));
console.log(`${plugins.length} plugin(s) valid: ${plugins.map(p => p.manifest.id).join(', ')}`);
if (!check) {
  writeFileSync(new URL('index.json', root), JSON.stringify({schema: INDEX_FORMAT, plugins}, null, 2) + '\n');
  console.log('index.json written');
}
