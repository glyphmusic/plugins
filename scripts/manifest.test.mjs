import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validate, checkCss, checkLookFile, lookFiles, PERMISSIONS, ITEM_TYPES} from './manifest.mjs';

test('looks: themes and extensions may bring font, corners, pictures and a style sheet', () => {
  const ext = {schema: 2, id: 'neon', name: 'Neon', version: '1.0.0', kind: 'extension', look: {font: 'serif', radius: 1.5, css: 'style.css', backgrounds: ['bg/a.webp']}};
  assert.deepEqual(validate(ext), []);
  const theme = {id: 'dusk', name: 'Dusk', version: '1.0.0', kind: 'theme', theme: {accent: '#ff8a3d'}, look: {font: 'rounded'}};
  assert.deepEqual(validate(theme), []);
  assert.deepEqual(validate({...ext, look: {assets: ['fonts/a.woff2', 'img/b.svg'], icons: {heart: 'icons/heart.svg', 'heart-fill': 'icons/heart.svg'}}}), []);
  for (const look of [{}, {font: 'comic'}, {radius: 3}, {css: 'x.js'}, {backgrounds: ['../x.png']}, {backgrounds: ['x.gif']}, {css: 'a.css', backgrounds: ['a.css']},
    {assets: ['x.exe']}, {icons: {Heart: 'h.svg'}}, {icons: {heart: 'h.png'}}]) {
    assert.ok(validate({...ext, look}).length, JSON.stringify(look));
  }
});

test('looks: the style sheet only loads its own files and stays balanced', () => {
  assert.equal(checkCss('[data-part="sidebar"] { opacity: .8 } /* } */ .a::after { content: "}" }'), null);
  assert.equal(checkCss('@media (max-width: 900px) { .a { color: red } }'), null);
  const assets = ['img/a.png', 'fonts/x.woff2'];
  assert.equal(checkCss('.a { background: url(img/a.png) }', assets), null);
  assert.equal(checkCss('@font-face { font-family: X; src: url( "fonts/x.woff2" ) format("woff2") }', assets), null);
  for (const bad of ['} * { display: none }', '.a { color: red', '.a { background: URL(x) }', "@import 'x.css';",
    '.a { background: url(img/b.png) }', ".a { background: url('https://x.example/a.png') }", '.a { background: url(img/a.png }',
    String.raw`.a { content: '\75 rl(' }`, '.a { content: "unclosed }', '/* open', '</style>', 'a{}'.repeat(50000)]) {
    assert.ok(checkCss(bad, assets), bad.slice(0, 40));
  }
  const look = {css: 's.css', backgrounds: ['a.png'], assets: ['f.woff2'], icons: {heart: 'h.svg'}};
  assert.equal(checkLookFile(look, 'a.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10])), null);
  assert.ok(checkLookFile(look, 'a.png', new TextEncoder().encode('GIF89a')));
  assert.equal(checkLookFile(look, 'f.woff2', new TextEncoder().encode('wOF2....')), null);
  assert.equal(checkLookFile(look, 'h.svg', new TextEncoder().encode('<svg/>')), null);
  assert.ok(checkLookFile(look, 'h.svg', new TextEncoder().encode('<svg>' + 'x'.repeat(40000))));
  assert.ok(checkLookFile(look, 's.css', new TextEncoder().encode('} body { display: none }')));
});

test('looks: own font files, monospaced font and app icon', () => {
  const ext = {schema: 2, id: 'neon', name: 'Neon', version: '1.0.0', kind: 'extension'};
  const look = {font: 'fonts/Literata.woff2', mono: 'fonts/Code.ttf', app_icon: 'icon.png'};
  assert.deepEqual(validate({...ext, look}), []);
  assert.deepEqual(lookFiles({look}), ['fonts/Code.ttf', 'fonts/Literata.woff2', 'icon.png']);
  assert.deepEqual(validate({...ext, look: {font: 'f/a.woff2', mono: 'f/a.woff2'}}), []);
  assert.deepEqual(validate({...ext, look: {mono: 'serif'}}), []);
  for (const bad of [{font: 'f/a.exe'}, {font: '../a.woff2'}, {mono: 'pixel'}, {app_icon: 'icon.svg'},
    {font: 'f/a.woff2', assets: ['f/a.woff2']}, {app_icon: 'a.png', backgrounds: ['a.png']}]) {
    assert.ok(validate({...ext, look: bad}).length, JSON.stringify(bad));
  }
  const png = (w, h) => {
    const b = new Uint8Array(24);
    b.set([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
    new DataView(b.buffer).setUint32(16, w);
    new DataView(b.buffer).setUint32(20, h);
    return b;
  };
  assert.equal(checkLookFile(look, 'icon.png', png(512, 512)), null);
  assert.ok(checkLookFile(look, 'icon.png', png(512, 256)));
  assert.ok(checkLookFile(look, 'icon.png', png(32, 32)));
  assert.ok(checkLookFile(look, 'icon.png', png(2048, 2048)));
  assert.equal(checkLookFile(look, 'fonts/Code.ttf', new Uint8Array([0, 1, 0, 0, 9])), null);
  assert.ok(checkLookFile(look, 'fonts/Literata.woff2', new TextEncoder().encode('nope')));
});

const example = () => JSON.parse(readFileSync(new URL('../examples/glyph-lastfm-profile/glyph-plugin.json', import.meta.url), 'utf8'));

test('own-key Last.fm setup is accepted without requiring a built Wasm artifact', () => {
  assert.deepEqual(validate(example()), []);
});

test('credentials cannot ship defaults or live among Glyph settings', () => {
  for (const mutate of [
    m => { m.settings[0].items[0].default = 'do-not-ship-keys'; },
    m => { m.settings[0].items[0].secret = false; },
    m => { m.settings[0].items[0].type = 'note'; },
    m => { m.settings[0].items[0].required = 'yes'; },
    m => { m.settings[0].page = 'integrations'; },
  ]) {
    const m = example(); mutate(m);
    assert.ok(validate(m).length, 'unsafe credential manifest must be refused');
  }
});

test('new local extension capabilities are explicit; raw server access is unknown', () => {
  const m = example();
  m.permissions.push('audio', 'lyrics_provider');
  m.settings[0].items.push({id:'meter', type:'progress', label:'Audio level'});
  assert.deepEqual(validate(m), []);
  m.permissions.push('server');
  assert.ok(validate(m).length);
  assert.ok(PERMISSIONS.includes('audio'));
  assert.ok(ITEM_TYPES.includes('progress'));
});

test('credentials require an exact declared destination and normalized path', () => {
  for (const mutate of [
    c => { c.host = 'evil.example.com'; },
    c => { c.host = '*.audioscrobbler.com'; },
    c => { c.path = '/2.0/../echo'; },
    c => { c.path = '/2.0/?redirect=evil'; },
    c => { c.location = 'body'; },
    c => { c.name = 'key\r\nHost'; },
  ]) {
    const m = example(); mutate(m.settings[0].items[0].credential);
    assert.ok(validate(m).length);
  }
  const missing = example(); delete missing.settings[0].items[0].credential;
  assert.ok(validate(missing).length);
});

test('protected warnings cannot be hidden or renamed by an extension', () => {
  const m = example();
  m.hide = ['plugins.setup.missing'];
  m.strings = {en:{'plugins.setup.requires':'No key required'}};
  assert.ok(validate(m).length >= 2);
});

test('JSON schema and executable validator advertise the same capabilities', () => {
  const schema = JSON.parse(readFileSync(new URL('../schema/glyph-plugin.schema.json', import.meta.url), 'utf8'));
  assert.deepEqual(schema.properties.permissions.items.enum, PERMISSIONS);
  assert.deepEqual(schema.$defs.item.properties.type.enum, ITEM_TYPES);
  assert.equal(schema.$defs.item.properties.required.type, 'boolean');
});
