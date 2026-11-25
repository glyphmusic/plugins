// The rules every glyph-plugin.json must follow. They mirror
// Manifest::validate in the app (glyph-core/src/plugins.rs) and the page on
// glyph.my/plugins, so a manifest this accepts is one Glyph installs.
// Used by build-index.mjs (the index CI) and validate.mjs (plugin makers).

export const MANIFEST = 'glyph-plugin.json';
/** Highest manifest schema: 1 themes, 2 extensions. */
export const SCHEMA = 2;
/** Brightest channel a theme's base may have: text is drawn light on it. */
export const MAX_BASE_CHANNEL = 0x24;
/** Placeholder id of glyphmusic/plugin-template; never a real plugin. */
export const TEMPLATE_ID = 'change-me';
/** Plugin kinds this version of the rules knows. */
export const KINDS = ['theme', 'extension'];
/** Permissions plugin code can ask for. */
export const PERMISSIONS = ['playback', 'library', 'search', 'settings', 'network', 'audio', 'lyrics_provider'];
/** Settings pages plugins can add sections to ("own": the plugin's page). */
export const PAGES = ['own', 'playback', 'playback.content', 'playback.sources', 'audio', 'appearance', 'integrations', 'storage', 'system', 'about'];
/** Settings controls plugins can add. */
export const ITEM_TYPES = ['toggle', 'slider', 'select', 'text', 'button', 'note', 'link', 'progress'];
/** Glyph texts plugins may neither replace nor hide. */
export const PROTECTED_KEYS = ['plugins.', 'account.', 'mcp.'];
/** Largest plugin code (.wasm). */
export const MAX_CODE = 16 * 1024 * 1024;
/** Fonts a look can pick (system fonts); `font` and `mono` can also be a font file in the repo. */
export const FONTS = ['inter', 'system', 'rounded', 'serif', 'mono'];
/** Font files a look can use as `font` / `mono`. */
export const FONT_FILES = ['woff2', 'woff', 'ttf', 'otf'];
/** The app icon: a square .png, at most this big, sides in pixels. */
export const MAX_APP_ICON = 1024 * 1024;
export const APP_ICON_MIN = 64, APP_ICON_MAX = 1024;
/** Parts a look can order and hide: home page sections, sidebar entries, phone tabs. Unknown names are allowed (newer Glyph). */
export const LAYOUT_AREAS = {
  home: ['greeting', 'cards', 'recent', 'new_releases', 'mixes', 'recs', 'trending'],
  sidebar: ['home', 'search', 'library', 'now_playing', 'lists'],
  tabs: ['home', 'search', 'library'],
};
export const MAX_LAYOUT_PARTS = 30;
/** Where a look can put the sidebar. */
export const SIDEBAR_POSITIONS = ['left', 'right'];
/** Largest startup animation picture: rows, characters per row. */
export const MAX_SPLASH_ROWS = 40, MAX_SPLASH_COLS = 60;
/** Whether a look's `font` / `mono` names a font file. */
export const isFontFile = f => typeof f === 'string' && FONT_FILES.includes((f.split('.').pop() ?? '').toLowerCase()) && f.includes('.');
/** Background pictures per look, and the size of each. */
export const MAX_LOOK_BACKGROUNDS = 8;
export const MAX_LOOK_PICTURE = 8 * 1024 * 1024;
/** Largest style sheet of a look. */
export const MAX_CSS = 128 * 1024;
/** Files the style sheet may use with url(), and the size of each. */
export const MAX_LOOK_ASSETS = 40;
export const MAX_LOOK_ASSET = 2 * 1024 * 1024;
/** Icons a look may replace, and the size of each .svg. */
export const MAX_LOOK_ICONS = 400;
export const MAX_ICON = 32 * 1024;
/** All files of one look together. */
export const MAX_LOOK_TOTAL = 32 * 1024 * 1024;
const ASSET_TYPES = ['woff2', 'woff', 'ttf', 'otf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
/** What a look's style sheet may not use: things that load by themselves (url() is checked apart), old script hooks, escapes. */
const CSS_BANNED = ['@import', '@namespace', '@charset', 'image-set(', 'image(', 'src(', 'element(',
  'expression(', 'javascript:', '-moz-binding', 'behavior:', '\\', '<'];

export const validId = id => typeof id === 'string' && id.length >= 2 && id.length <= 40
  && /^[a-z0-9-]+$/.test(id) && !id.startsWith('-') && !id.endsWith('-') && !id.includes('--');
export const validRepo = r => typeof r === 'string' && /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(r)
  && !r.split('/').some(s => s === '.' || s === '..');
export const validPath = p => p === '' || (typeof p === 'string' && p.length <= 200 && /^[A-Za-z0-9_.\/-]+$/.test(p)
  && p.split('/').every(s => s && s !== '.' && s !== '..'));
/** Longest `changes` text. */
export const MAX_CHANGES = 300;

/** `max_app` as [major, minor, patch, wholeLine]: a version, or a minor line (`0.14`, `0.14.x`). */
export function parseMaxApp(s) {
  if (typeof s !== 'string') return null;
  if (semver.test(s)) { const [a, b, c] = s.split(/[-+]/)[0].split('.').map(Number); return [a, b, c, false]; }
  const m = /^(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})(\.x)?$/.exec(s);
  return m ? [Number(m[1]), Number(m[2]), 0, true] : null;
}

export const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;
export const isHex = s => typeof s === 'string' && /^#?[0-9a-fA-F]{6}$/.test(s.trim());
export const hexValue = s => parseInt(s.trim().replace('#', ''), 16);
const chars = s => [...(s ?? '')].length;
const isObj = v => typeof v === 'object' && v !== null && !Array.isArray(v);
const validLang = c => typeof c === 'string' && /^[a-z]{2}$/.test(c);
const validKey = k => typeof k === 'string' && /^[a-z0-9_-]{1,40}$/.test(k);
const validTextKey = k => typeof k === 'string' && /^[A-Za-z0-9._-]{1,100}$/.test(k);
const isProtected = k => PROTECTED_KEYS.some(p => k.startsWith(p));
export const validHost = h => {
  if (typeof h !== 'string') return false;
  const name = h.startsWith('*.') ? h.slice(2) : h;
  return name.length >= 3 && name.length <= 253 && name.includes('.')
    && name.split('.').every(l => /^[a-z0-9-]{1,63}$/.test(l) && !l.startsWith('-') && !l.endsWith('-'));
};

/** A text: "plain" or {"en": "...", "de": "..."}. */
const isText = t => typeof t === 'string' || (isObj(t) && Object.entries(t).every(([k, v]) => validLang(k) && typeof v === 'string'));
const textLen = t => t === undefined ? 0 : typeof t === 'string' ? chars(t) : Math.max(0, ...Object.values(t).map(chars));
const textEmpty = t => t === undefined || (typeof t === 'string' ? !t.trim() : Object.values(t).every(v => !v.trim()));

/** Problems with manifest `m`, as sentences; empty when it is valid. */
export function validate(m) {
  const err = [];
  if (!isObj(m)) return ['the file must contain one JSON object'];
  const schema = m.schema ?? 1;
  if (!Number.isInteger(schema) || schema < 1 || schema > SCHEMA) err.push(`schema must be 1 (themes) or 2 (extensions)`);
  if (!validId(m.id)) err.push('id must be 2-40 characters of a-z, 0-9 and single dashes (not at the start or end)');
  if (m.id === TEMPLATE_ID) err.push(`give the plugin its own id ("${TEMPLATE_ID}" is the template's)`);
  if (typeof m.name !== 'string' || !m.name.trim() || chars(m.name) > 40) err.push('name must be 1-40 characters');
  for (const f of ['author', 'license', 'description']) {
    if (m[f] !== undefined && typeof m[f] !== 'string') err.push(`${f} must be text`);
  }
  if (chars(m.author) > 40) err.push('author may have at most 40 characters');
  if (chars(m.license) > 40) err.push('license may have at most 40 characters');
  if (chars(m.description) > 200) err.push('description may have at most 200 characters');
  if (typeof m.version !== 'string' || !semver.test(m.version)) err.push('version must be a semantic version like 1.0.0');
  if (m.min_app !== undefined && (typeof m.min_app !== 'string' || !semver.test(m.min_app))) err.push('min_app must be a semantic version like 0.7.0');
  if (m.max_app !== undefined) {
    const max = parseMaxApp(m.max_app);
    if (!max) err.push('max_app must be a version like 0.14.2, 0.14 or 0.14.x');
    else if (typeof m.min_app === 'string' && semver.test(m.min_app)) {
      const min = m.min_app.split(/[-+]/)[0].split('.').map(Number);
      const cmp = max[3] ? [min[0], min[1]] : min;
      const top = max[3] ? [max[0], max[1]] : max.slice(0, 3);
      const newer = cmp.findIndex((v, i) => v !== top[i]);
      if (newer >= 0 && cmp[newer] > top[newer]) err.push('min_app must not be newer than max_app');
    }
  }
  if (m.changes !== undefined && typeof m.changes !== 'string') err.push('changes must be text');
  else if (chars(m.changes) > MAX_CHANGES) err.push(`changes may have at most ${MAX_CHANGES} characters`);
  if (m.theme !== undefined) err.push(...validateTheme(m.theme));
  if (m.look !== undefined) err.push(...validateLook(m.look));
  if (!KINDS.includes(m.kind)) {
    err.push(`kind must be one of: ${KINDS.join(', ')} (got ${JSON.stringify(m.kind)})`);
  } else if (m.kind === 'theme') {
    if (m.theme === undefined) err.push('a theme plugin needs a "theme" object');
    if (['main', 'strings', 'hide', 'settings', 'menus', 'permissions', 'network'].some(f => m[f] !== undefined && !(Array.isArray(m[f]) && !m[f].length))) {
      err.push('a theme has colours and a look only; use "kind": "extension" for more');
    }
  } else {
    if (schema < 2) err.push('extensions need "schema": 2');
    err.push(...validateExtension(m));
  }
  return err;
}

function validateTheme(t) {
  if (!isObj(t)) return ['"theme" must be an object with at least "accent"'];
  const err = [];
  if (!isHex(t.accent)) err.push('theme.accent must be a colour like #ff8a3d');
  if (t.glow !== undefined && !(Array.isArray(t.glow) && t.glow.length === 3 && t.glow.every(isHex))) {
    err.push('theme.glow must be three colours like ["#3a1206", "#ff6516", "#ffc04a"] (dark, middle, bright)');
  }
  if (t.base !== undefined) {
    if (!isHex(t.base)) err.push('theme.base must be a colour like #050302');
    else {
      const v = hexValue(t.base);
      if ([v >> 16, (v >> 8) & 0xff, v & 0xff].some(c => c > MAX_BASE_CHANNEL)) {
        err.push(`theme.base must stay near black: each channel at most #${MAX_BASE_CHANNEL.toString(16)} (got ${t.base})`);
      }
    }
  }
  return err;
}

function validateLook(l) {
  if (!isObj(l)) return ['"look" must be an object'];
  const err = [];
  const bgs = l.backgrounds ?? [], assets = l.assets ?? [], icons = l.icons ?? {};
  if (l.font === undefined && l.mono === undefined && l.app_icon === undefined && l.home === undefined && l.sidebar === undefined && l.tabs === undefined && l.sidebar_position === undefined && l.splash === undefined && l.radius === undefined && l.css === undefined && !(Array.isArray(bgs) && bgs.length)
    && !(Array.isArray(assets) && assets.length) && !(isObj(icons) && Object.keys(icons).length)) {
    err.push('look: needs a font, mono, app_icon, radius, backgrounds, css, assets, icons, home, sidebar, tabs, sidebar_position or splash');
  }
  if (l.sidebar_position !== undefined && !SIDEBAR_POSITIONS.includes(l.sidebar_position)) err.push('look.sidebar_position must be "left" or "right"');
  if (l.splash !== undefined) {
    const s = l.splash;
    const row = r => typeof r === 'string' && r.length <= MAX_SPLASH_COLS && /^[\x20-\x7e]*$/.test(r);
    if (!isObj(s) || Object.keys(s).some(k => !['art', 'tint', 'speed'].includes(k))) err.push('look.splash must be an object with "art", "tint" and "speed"');
    else if (!Array.isArray(s.art) || !s.art.length || s.art.length > MAX_SPLASH_ROWS || !s.art.every(row)) err.push(`look.splash.art takes 1 to ${MAX_SPLASH_ROWS} rows of at most ${MAX_SPLASH_COLS} printable ASCII characters`);
    else if (!s.art.some(r => r.trim())) err.push('look.splash.art needs at least one character');
    else if (s.tint !== undefined && (!Array.isArray(s.tint) || s.tint.length !== s.art.length || !s.tint.every(row))) err.push('look.splash.tint has one row per row of look.splash.art');
    else if (s.speed !== undefined && !(typeof s.speed === 'number' && s.speed >= 0.5 && s.speed <= 2)) err.push('look.splash.speed must be a number from 0.5 to 2');
  }
  for (const area of Object.keys(LAYOUT_AREAS)) {
    const spec = l[area];
    if (spec === undefined) continue;
    if (!isObj(spec) || Object.keys(spec).some(k => k !== 'order' && k !== 'hide')) { err.push(`look.${area} must be an object with "order" and/or "hide"`); continue; }
    for (const key of ['order', 'hide']) {
      const list = spec[key] ?? [];
      if (!Array.isArray(list) || list.length > MAX_LAYOUT_PARTS) err.push(`look.${area}.${key} takes up to ${MAX_LAYOUT_PARTS} names`);
      else if (list.some(n => typeof n !== 'string' || !/^[a-z0-9_-]{1,40}$/.test(n))) err.push(`look.${area}.${key} names are 1-40 of a-z, 0-9, - and _`);
      else if (new Set(list).size !== list.length) err.push(`look.${area}.${key} names each only once`);
    }
  }
  const ext = f => (f.split('.').pop() ?? '').toLowerCase();
  for (const key of ['font', 'mono']) {
    const f = l[key];
    if (f !== undefined && !FONTS.includes(f) && !(isFontFile(f) && validPath(f))) {
      err.push(`look.${key} must be one of: ${FONTS.join(', ')}, or the path of a .woff2, .woff, .ttf or .otf file in the repo`);
    }
  }
  if (l.app_icon !== undefined && (typeof l.app_icon !== 'string' || !l.app_icon || !validPath(l.app_icon) || ext(l.app_icon) !== 'png')) {
    err.push('look.app_icon must be the path of a .png file in the repo');
  }
  if (l.radius !== undefined && !(typeof l.radius === 'number' && l.radius >= 0 && l.radius <= 2)) err.push('look.radius must be a number from 0 to 2');
  if (!Array.isArray(bgs) || bgs.length > MAX_LOOK_BACKGROUNDS) err.push(`look.backgrounds takes up to ${MAX_LOOK_BACKGROUNDS} pictures`);
  else for (const b of bgs) {
    if (typeof b !== 'string' || !b || !validPath(b) || !['png', 'jpg', 'jpeg', 'webp'].includes(b.split('.').pop())) err.push(`look.backgrounds: "${b}" must be the path of a .png, .jpg or .webp file in the repo`);
  }
  if (l.css !== undefined && (typeof l.css !== 'string' || !validPath(l.css) || !l.css.endsWith('.css'))) err.push('look.css must be the path of a .css file in the repo');
  if (!Array.isArray(assets) || assets.length > MAX_LOOK_ASSETS) err.push(`look.assets takes up to ${MAX_LOOK_ASSETS} files`);
  else for (const a of assets) {
    if (typeof a !== 'string' || !a || !validPath(a) || !ASSET_TYPES.includes(a.split('.').pop())) err.push(`look.assets: "${a}" must be the path of a font (.woff2, .woff, .ttf, .otf) or picture (.png, .jpg, .webp, .gif, .svg) in the repo`);
  }
  if (!isObj(icons) || Object.keys(icons).length > MAX_LOOK_ICONS) err.push(`look.icons takes up to ${MAX_LOOK_ICONS} icons`);
  else for (const [name, file] of Object.entries(icons)) {
    if (!/^[a-z0-9-]{1,40}$/.test(name)) err.push(`look.icons: "${name}" is not an icon name (a-z, 0-9 and -)`);
    if (typeof file !== 'string' || !file || !validPath(file) || ext(file) !== 'svg') err.push(`look.icons.${name} must be the path of a .svg file in the repo`);
  }
  const fonts = [...new Set([l.font, l.mono].filter(isFontFile))];
  const jobs = [...(typeof l.css === 'string' ? [l.css] : []), ...(Array.isArray(bgs) ? bgs : []), ...(Array.isArray(assets) ? assets : []),
    ...fonts, ...(typeof l.app_icon === 'string' ? [l.app_icon] : [])];
  if (new Set(jobs).size !== jobs.length) err.push('look: each file only once (css, backgrounds, assets, font files and app_icon)');
  return err;
}

/** The files a manifest's look needs, each once. */
export function lookFiles(m) {
  const l = m?.look;
  if (!isObj(l)) return [];
  const all = [...(typeof l.css === 'string' ? [l.css] : []), ...(Array.isArray(l.backgrounds) ? l.backgrounds : []),
    ...(Array.isArray(l.assets) ? l.assets : []), ...(isObj(l.icons) ? Object.values(l.icons) : []),
    ...[l.font, l.mono].filter(isFontFile), ...(typeof l.app_icon === 'string' ? [l.app_icon] : [])];
  return [...new Set(all.filter(f => typeof f === 'string'))].sort();
}

/** Largest size file `name` of look `l` may have, by what it is used for. */
export function lookMaxSize(l, name) {
  let max = 0;
  if (l?.css === name) max = Math.max(max, MAX_CSS);
  if ((l?.backgrounds ?? []).includes(name)) max = Math.max(max, MAX_LOOK_PICTURE);
  if ((l?.assets ?? []).includes(name)) max = Math.max(max, MAX_LOOK_ASSET);
  if (Object.values(l?.icons ?? {}).includes(name)) max = Math.max(max, MAX_ICON);
  if ([l?.font, l?.mono].filter(isFontFile).includes(name)) max = Math.max(max, MAX_LOOK_ASSET);
  if (l?.app_icon === name) max = Math.max(max, MAX_APP_ICON);
  return max;
}

/** Where a style sheet uses url(...): [{start, end, addr}], or a problem as text. */
export function cssUrls(css) {
  const low = css.toLowerCase();
  const out = [];
  let from = 0;
  for (;;) {
    const start = low.indexOf('url(', from);
    if (start < 0) return out;
    let i = start + 4;
    while (i < css.length && /\s/.test(css[i])) i++;
    let addr;
    if (css[i] === '"' || css[i] === "'") {
      const end = css.indexOf(css[i], i + 1);
      if (end < 0) return 'the style sheet has an unclosed url(';
      addr = css.slice(i + 1, end).trim();
      i = end + 1;
    } else {
      const end = css.indexOf(')', i);
      if (end < 0) return 'the style sheet has an unclosed url(';
      addr = css.slice(i, end).trim();
      i = end;
    }
    while (i < css.length && /\s/.test(css[i])) i++;
    if (css[i] !== ')') return 'the style sheet has an unclosed url(';
    out.push({start, end: i + 1, addr});
    from = i + 1;
  }
}

/** Problem with a look's style sheet, or null: small, url() only for `assets`, nothing else that loads, braces balanced. */
export function checkCss(css, assets = []) {
  if (new TextEncoder().encode(css).length > MAX_CSS) return `the style sheet is larger than ${MAX_CSS / 1024} KB`;
  const low = css.toLowerCase();
  const banned = CSS_BANNED.find(b => low.includes(b));
  if (banned) return `the style sheet may not use ${banned}`;
  const urls = cssUrls(css);
  if (typeof urls === 'string') return urls;
  const stray = urls.find(u => !assets.includes(u.addr));
  if (stray) return `url(${stray.addr}) must be one of the look's assets`;
  let depth = 0;
  for (let i = 0; i < css.length;) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end < 0) return 'the style sheet has an unclosed comment';
      i = end + 2;
    } else if (c === '"' || c === "'") {
      const end = css.indexOf(c, i + 1);
      if (end < 0 || css.slice(i + 1, end).includes('\n')) return 'the style sheet has an unclosed string';
      i = end + 1;
    } else {
      if (c === '{') depth++;
      else if (c === '}' && --depth < 0) return 'the style sheet has a } without a {';
      i++;
    }
  }
  return depth ? 'the style sheet has a { without a }' : null;
}

/** Problem with file `name` of look `l`, or null. */
export function checkLookFile(l, name, bytes) {
  const max = lookMaxSize(l, name);
  if (bytes.length > max) return `${name}: at most ${Math.floor(max / 1024)} KB`;
  const ext = (name.split('.').pop() ?? '').toLowerCase();
  const b = bytes;
  const starts = sig => sig.every((x, i) => b[i] === (typeof x === 'string' ? x.charCodeAt(0) : x));
  const text = () => { try { return new TextDecoder('utf-8', {fatal: true}).decode(bytes); } catch { return null; } };
  if (ext === 'css') {
    const css = text();
    if (css === null) return `${name}: the style sheet is not UTF-8 text`;
    const p = checkCss(css, l?.assets ?? []);
    return p && `${name}: ${p}`;
  }
  if (ext === 'png' && l?.app_icon === name) {
    if (!starts([0x89, 'P', 'N', 'G', 13, 10, 26, 10]) || b.length < 24 || String.fromCharCode(...b.slice(12, 16)) !== 'IHDR') return `${name}: the app icon is not a PNG file`;
    const side = i => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const w = side(16), h = side(20);
    if (w !== h || w < APP_ICON_MIN || w > APP_ICON_MAX) return `${name}: the app icon must be square, ${APP_ICON_MIN} to ${APP_ICON_MAX} pixels (it is ${w} x ${h})`;
    return null;
  }
  const ok = {
    png: () => starts([0x89, 'P', 'N', 'G']), jpg: () => starts([0xff, 0xd8, 0xff]), jpeg: () => starts([0xff, 0xd8, 0xff]),
    webp: () => starts(['R', 'I', 'F', 'F']) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
    gif: () => starts(['G', 'I', 'F', '8']), svg: () => (text() ?? '').includes('<svg'),
    woff2: () => starts(['w', 'O', 'F', '2']), woff: () => starts(['w', 'O', 'F', 'F']),
    ttf: () => starts([0, 1, 0, 0]) || starts(['t', 'r', 'u', 'e']), otf: () => starts(['O', 'T', 'T', 'O']),
  }[ext];
  return ok?.() ? null : `${name}: not a ${ext} file`;
}

function validateExtension(m) {
  const err = [];
  const perms = m.permissions ?? [], network = m.network ?? [], strings = m.strings ?? {}, hide = m.hide ?? [];
  const settings = m.settings ?? [], menus = m.menus ?? [];
  if (m.theme === undefined && m.look === undefined && m.main === undefined && !Object.keys(strings).length && !hide.length) {
    err.push('an extension needs code ("main"), "strings", "hide", a "theme" or a "look"');
  }
  if (m.main !== undefined) {
    if (typeof m.main !== 'string' || !m.main || !validPath(m.main) || !m.main.endsWith('.wasm')) err.push('main must be the path of a .wasm file in the repo');
  } else if (settings.length || menus.length || perms.length) {
    err.push('settings, menus and permissions need code ("main")');
  }
  if (!Array.isArray(perms) || perms.some(p => !PERMISSIONS.includes(p))) err.push(`permissions are a list of: ${PERMISSIONS.join(', ')}`);
  if (!Array.isArray(network) || network.length > 20 || network.some(h => !validHost(h))) err.push('network takes up to 20 host names like api.example.com or *.example.com');
  const wantsNet = Array.isArray(perms) && perms.includes('network');
  if (wantsNet !== (Array.isArray(network) && network.length > 0)) err.push('the network permission and the "network" hosts go together');
  // Texts
  if (!isObj(strings)) err.push('strings must be an object of languages ({"en": {...}})');
  else {
    for (const [lang, texts] of Object.entries(strings)) {
      if (!validLang(lang)) { err.push(`strings: "${lang}" is not a two-letter language code`); continue; }
      if (!isObj(texts)) { err.push(`strings.${lang} must be an object of texts`); continue; }
      if (Object.keys(texts).length > 2000) err.push('strings: at most 2000 texts per language');
      for (const [k, v] of Object.entries(texts)) {
        if (!validTextKey(k)) err.push(`strings: "${k}" is not a valid text key`);
        else if (!k.startsWith(`${m.id}.`) && isProtected(k)) err.push(`strings: "${k}" can't be replaced (plugin warnings, account and assistant texts stay Glyph's)`);
        if (typeof v !== 'string' || chars(v) > 500) err.push(`strings: "${k}" must be text of at most 500 characters`);
      }
    }
  }
  if (!Array.isArray(hide) || hide.length > 200) err.push('hide takes up to 200 row keys');
  else for (const k of hide) if (!validTextKey(k) || isProtected(k)) err.push(`hide: "${k}" can't be hidden`);
  // Settings
  if (!Array.isArray(settings) || settings.length > 20) err.push('settings: at most 20 sections');
  else {
    const sids = new Set(), iids = new Set();
    for (const s of settings) {
      if (!isObj(s)) { err.push('settings: each section is an object'); continue; }
      if (!validKey(s.id) || sids.has(s.id)) err.push(`settings: section id "${s.id}" must be unique, 1-40 of a-z, 0-9, _ and -`);
      sids.add(s.id);
      const page = s.page ?? 'own';
      if (!PAGES.includes(page)) err.push(`settings.${s.id}: page must be one of ${PAGES.join(', ')}`);
      if (s.after !== undefined && !validTextKey(s.after)) err.push(`settings.${s.id}: "after" must be a row's label key`);
      if (s.title !== undefined && (!isText(s.title) || textLen(s.title) > 60)) err.push(`settings.${s.id}: title must be text of at most 60 characters`);
      if (!Array.isArray(s.items) || !s.items.length || s.items.length > 40) { err.push(`settings.${s.id}: needs 1-40 items`); continue; }
      for (const i of s.items) {
        if (!isObj(i)) { err.push(`settings.${s.id}: each item is an object`); continue; }
        if (iids.has(i.id)) err.push(`settings: item id "${i.id}" is used twice (ids are unique across all sections)`);
        iids.add(i.id);
        err.push(...validateItem(s.id, i));
        if (i.secret && page !== 'own') err.push('credentials must be on the plugin own page');
        if (i.secret && (!isObj(i.credential) || !validHost(i.credential.host) || i.credential.host.startsWith('*.')
          || !wantsNet || !Array.isArray(network) || !network.some(h => h === i.credential.host || h.startsWith('*.') && (i.credential.host === h.slice(2) || i.credential.host.endsWith('.' + h.slice(2)))))) err.push('credential needs an exact declared network host');
      }
    }
  }
  if (!Array.isArray(menus) || menus.length > 10) err.push('menus: at most 10 entries');
  else {
    const mids = new Set();
    for (const e of menus) {
      if (!isObj(e) || !validKey(e.id) || mids.has(e.id)) { err.push(`menus: id "${e?.id}" must be unique, 1-40 of a-z, 0-9, _ and -`); continue; }
      mids.add(e.id);
      if ((e.menu ?? 'song') !== 'song') err.push(`menus.${e.id}: menu must be "song"`);
      if (!isText(e.label) || textEmpty(e.label) || textLen(e.label) > 40) err.push(`menus.${e.id}: needs a label of 1-40 characters`);
    }
  }
  return err;
}

function validateItem(section, i) {
  const at = `settings.${section}.${i.id}`;
  const err = [];
  if (!validKey(i.id)) err.push(`${at}: id must be 1-40 of a-z, 0-9, _ and -`);
  if (!ITEM_TYPES.includes(i.type)) return [...err, `${at}: type must be one of ${ITEM_TYPES.join(', ')}`];
  for (const [f, max] of [['label', 60], ['desc', 300], ['placeholder', 60], ['caption', 40]]) {
    if (i[f] !== undefined && (!isText(i[f]) || textLen(i[f]) > max)) err.push(`${at}: ${f} must be text of at most ${max} characters`);
  }
  if (i.type !== 'note' && textEmpty(i.label)) err.push(`${at}: needs a label`);
  const d = i.default;
  if (i.secret !== undefined && typeof i.secret !== 'boolean') err.push(`${at}: secret must be a boolean`);
  if (i.required !== undefined && typeof i.required !== 'boolean') err.push(`${at}: required must be a boolean`);
  if ((i.secret || i.required) && (i.type !== 'text' || !i.secret || d !== undefined)) err.push(`${at}: credentials must be secret text rows without defaults; required needs secret`);
  if (!!i.secret !== (i.credential !== undefined)) err.push(`${at}: secret fields require a credential destination`);
  if (i.credential !== undefined) {
    const c = i.credential;
    if (!isObj(c) || Object.keys(c).some(k => !['host','path','location','name'].includes(k))
      || !['query','headers'].includes(c.location) || typeof c.name !== 'string'
      || !/^[A-Za-z0-9_-]{1,100}$/.test(c.name)) err.push(`${at}: invalid credential field binding`);
    try {
      const url = new URL(`https://${c.host}${c.path}`);
      if (typeof c.path !== 'string' || !c.path.startsWith('/') || c.path.length > 200 || url.hostname !== c.host
        || url.pathname !== c.path || url.search || url.hash) throw new Error();
    } catch { err.push(`${at}: credential path must be exact, without query or fragment`); }
  }
  switch (i.type) {
    case 'toggle':
      if (d !== undefined && typeof d !== 'boolean') err.push(`${at}: default must be true or false`);
      break;
    case 'slider': {
      const min = i.min ?? 0, max = i.max ?? 100;
      if (typeof min !== 'number' || typeof max !== 'number' || !(min < max) || (i.step !== undefined && !(typeof i.step === 'number' && i.step > 0))) err.push(`${at}: needs min < max and a positive step`);
      if (d !== undefined && (typeof d !== 'number' || d < min || d > max)) err.push(`${at}: default must be a number between min and max`);
      if (chars(i.unit) > 8) err.push(`${at}: unit may have 8 characters`);
      break;
    }
    case 'select': {
      const o = i.options;
      if (!Array.isArray(o) || !o.length || o.length > 50 || o.some(x => !isObj(x) || typeof x.value !== 'string' || !x.value || x.value.length > 60 || !isText(x.label) || textEmpty(x.label) || textLen(x.label) > 60)) {
        err.push(`${at}: needs 1-50 options, each with a value and a label`);
      } else if (d !== undefined && !o.some(x => x.value === d)) err.push(`${at}: default must be one of the option values`);
      break;
    }
    case 'text':
      if (d !== undefined && (typeof d !== 'string' || chars(d) > 500)) err.push(`${at}: default must be text (500 characters at most)`);
      break;
    case 'link':
      if (typeof i.url !== 'string' || !i.url.startsWith('https://') || i.url.length > 500) err.push(`${at}: needs an https url`);
      break;
  }
  return err;
}

/** Checks that `bytes` look like a WebAssembly module of acceptable size. */
export function checkCode(bytes) {
  if (bytes.length > MAX_CODE) return `the code is larger than ${MAX_CODE / 1024 / 1024} MiB`;
  if (!(bytes[0] === 0 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d)) return 'the code is not a WebAssembly module (it must start with \\0asm)';
  return null;
}
