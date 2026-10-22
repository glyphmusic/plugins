// The rules every glyph-plugin.json must follow. They mirror
// Manifest::validate in the app (glyph-core/src/plugins.rs) and the page on
// glyph.my/plugins, so a manifest this accepts is one Glyph installs.
// Used by build-index.mjs (the index CI) and validate.mjs (plugin makers).

export const MANIFEST = 'glyph-plugin.json';
export const SCHEMA = 1;
/** Brightest channel a theme's base may have: text is drawn light on it. */
export const MAX_BASE_CHANNEL = 0x24;
/** Placeholder id of glyphmusic/plugin-template; never a real plugin. */
export const TEMPLATE_ID = 'change-me';
/** Plugin kinds this version of the rules knows. */
export const KINDS = ['theme'];

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

/** Problems with manifest `m`, as sentences; empty when it is valid. */
export function validate(m) {
  const err = [];
  if (typeof m !== 'object' || m === null || Array.isArray(m)) return ['the file must contain one JSON object'];
  const schema = m.schema ?? 1;
  if (schema !== SCHEMA) err.push(`schema must be ${SCHEMA}`);
  if (!validId(m.id)) err.push('id must be 2-40 characters of a-z, 0-9 and single dashes (not at the start or end)');
  if (m.id === TEMPLATE_ID) err.push(`give the plugin its own id ("${TEMPLATE_ID}" is the template's)`);
  if (typeof m.name !== 'string' || !m.name.trim() || chars(m.name) > 40) err.push('name must be 1-40 characters');
  if (m.author !== undefined && typeof m.author !== 'string') err.push('author must be text');
  if (m.license !== undefined && typeof m.license !== 'string') err.push('license must be text');
  if (m.description !== undefined && typeof m.description !== 'string') err.push('description must be text');
  if (chars(m.author) > 40) err.push('author may have at most 40 characters');
  if (chars(m.license) > 40) err.push('license may have at most 40 characters');
  if (chars(m.description) > 200) err.push('description may have at most 200 characters');
  if (typeof m.version !== 'string' || !semver.test(m.version)) err.push('version must be a semantic version like 1.0.0');
  if (m.min_app !== undefined && (typeof m.min_app !== 'string' || !semver.test(m.min_app))) err.push('min_app must be a semantic version like 0.7.0');
  if (!KINDS.includes(m.kind)) {
    err.push(`kind must be one of: ${KINDS.join(', ')} (got ${JSON.stringify(m.kind)})`);
  } else if (m.kind === 'theme') {
    err.push(...validateTheme(m.theme));
  }
  return err;
}

function validateTheme(t) {
  if (typeof t !== 'object' || t === null || Array.isArray(t)) return ['a theme plugin needs a "theme" object'];
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
