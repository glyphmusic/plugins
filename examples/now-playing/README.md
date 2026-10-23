# Now Playing Toast (example extension)

A small but complete Glyph extension in Rust. It shows how a plugin

- reacts to events (`track`, `action`, `menu`, `ready`),
- calls Glyph (`player.state`, `ui.toast`, `ui.get`, `ui.update`, `ui.open_artist`),
- keeps data (`storage.get` / `storage.set`),
- adds its own settings page, a section on Glyph's Playback › Content page and a song menu entry,
- uses its own texts in English and German (`strings`, `app.text`).

Its only permission is `playback`: it sees which song plays. It can't reach the network, so nothing it sees leaves your device.

## Build and try it

```sh
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/now_playing_toast.wasm plugin.wasm
```

Copy `glyph-plugin.json` and `plugin.wasm` into a folder named `now-playing-toast` in Glyph's plugins folder (**Settings › Plugins › Plugins folder › Open folder**) and press **Reload**. The plugin appears as *local*; its page shows up under **Settings › Plugins**, its log on its detail page.

Check the manifest and the code before publishing:

```sh
node ../../scripts/validate.mjs glyph-plugin.json
```

## Files

| File | What it is |
|---|---|
| `glyph-plugin.json` | the manifest: settings, menu entry, texts, permission |
| `src/glyph.rs` | bindings for Glyph's API; copy it into your own plugin |
| `src/lib.rs` | the plugin |

Full reference: [docs.glyph.my/plugins/api](https://docs.glyph.my/plugins/api).
