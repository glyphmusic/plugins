import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validate, PERMISSIONS, ITEM_TYPES} from './manifest.mjs';

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
