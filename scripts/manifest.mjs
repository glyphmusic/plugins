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

export const validId = id => typeof id === 'string' && id.length >= 2 && id.length <= 40
  && /^[a-z0-9-]+$/.test(id) && !id.startsWith('-') && !id.endsWith('-') && !id.includes('--');
export const validRepo = r => typeof r === 'string' && /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(r)
  && !r.split('/').some(s => s === '.' || s === '..');
export const validPath = p => p === '' || (typeof p === 'string' && p.length <= 200 && /^[A-Za-z0-9_.\/-]+$/.test(p)
  && p.split('/').every(s => s && s !== '.' && s !== '..'));
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
  if (m.theme !== undefined) err.push(...validateTheme(m.theme));
  if (!KINDS.includes(m.kind)) {
    err.push(`kind must be one of: ${KINDS.join(', ')} (got ${JSON.stringify(m.kind)})`);
  } else if (m.kind === 'theme') {
    if (m.theme === undefined) err.push('a theme plugin needs a "theme" object');
    if (['main', 'strings', 'hide', 'settings', 'menus', 'permissions', 'network'].some(f => m[f] !== undefined && !(Array.isArray(m[f]) && !m[f].length))) {
      err.push('a theme has colours only; use "kind": "extension" for more');
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

function validateExtension(m) {
  const err = [];
  const perms = m.permissions ?? [], network = m.network ?? [], strings = m.strings ?? {}, hide = m.hide ?? [];
  const settings = m.settings ?? [], menus = m.menus ?? [];
  if (m.theme === undefined && m.main === undefined && !Object.keys(strings).length && !hide.length) {
    err.push('an extension needs code ("main"), "strings", "hide" or a "theme"');
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
