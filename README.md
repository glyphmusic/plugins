# Glyph plugins

Plugins for [Glyph](https://github.com/glyphmusic/apps): colour themes and extensions. Extensions can rename any text, hide settings, add their own settings page, sections on Glyph's pages and song menu entries, and run code (WebAssembly, in a sandbox) that controls playback, the library, search and settings and talks to the web, as far as its permissions allow. Glyph finds plugins under **Settings → Plugins**, and they are listed on [glyph.my/plugins](https://glyph.my/plugins).

**Full documentation: [docs.glyph.my/plugins](https://docs.glyph.my/plugins)**: [quickstart](https://docs.glyph.my/plugins/quickstart), [extensions](https://docs.glyph.my/plugins/extensions), [API reference](https://docs.glyph.my/plugins/api), [settings and menus](https://docs.glyph.my/plugins/settings-ui), [how plugins work](https://docs.glyph.my/plugins/how-it-works), [manifest reference](https://docs.glyph.my/plugins/manifest), [designing a theme](https://docs.glyph.my/plugins/themes), [testing](https://docs.glyph.my/plugins/testing), [publishing](https://docs.glyph.my/plugins/publishing), [troubleshooting](https://docs.glyph.my/plugins/troubleshooting).

Fastest start: **[use the plugin template](https://github.com/glyphmusic/plugin-template/generate)** for a theme, or copy **[the example extension](examples/now-playing)** (Rust) for code.

Glyph looks for plugins in two places. It fetches both straight from GitHub on your device, without the Glyph server:

| Section in Glyph | Source | Can install |
|---|---|---|
| **Listed** | `index.json` in this repo. Each version is checked against the plugin rules (valid file, pinned version) before it is added. | everything |
| **Community** | every GitHub repo with the topic [`glyph-plugin`](https://github.com/topics/glyph-plugin). Nobody checks these. | plugins without code only (themes, texts, hidden rows) |

Glyph caches the list for an hour. **Refresh** loads it again. Old versions of Glyph show plugins they don't understand as "Needs a newer Glyph".

> **Plugins are made by their authors, not by Glyph.** Glyph cannot say whether a plugin is good or bad, and people install plugins at their own risk. Being listed here only means the manifest follows the rules below; it is no review of quality or safety. Glyph shows this warning before the first install of each plugin.

## Make a theme

1. Create a GitHub repository and put a `glyph-plugin.json` at its root:

   ```json
   {
     "$schema": "https://raw.githubusercontent.com/glyphmusic/plugins/main/schema/glyph-plugin.schema.json",
     "schema": 1,
     "id": "midnight-coral",
     "name": "Midnight Coral",
     "version": "1.0.0",
     "author": "your-name",
     "description": "Coral accent on a deep blue glow.",
     "license": "MIT",
     "kind": "theme",
     "theme": {
       "accent": "#ff7a6b",
       "glow": ["#06103a", "#2a4fd6", "#ff9b8a"],
       "base": "#020308"
     }
   }
   ```

2. Add the topic `glyph-plugin` to the repository (the gear next to **About** on the repo page).

That's all. Your theme now appears under **Community** in Glyph and on [glyph.my/plugins](https://glyph.my/plugins).

To share it, link to `https://glyph.my/plugins/<id>`. That page shows your theme and has an **Install in Glyph** button, which opens `glyph://plugin/<id>` in the app.

### Fields

| Field | Required | Rules |
|---|---|---|
| `schema` | no | `1` for themes, `2` for extensions |
| `id` | yes | 2–40 characters: `a-z`, `0-9` and single dashes. It must be unique, so pick something specific. |
| `name` | yes | up to 40 characters |
| `version` | yes | semantic version (`1.0.0`). Raise it to ship an update. |
| `author`, `license` | no | up to 40 characters each |
| `description` | no | up to 200 characters |
| `min_app` | no | oldest Glyph version the plugin needs (`0.7.0`) |
| `kind` | yes | `"theme"` (or `"extension"`, see below) |
| `theme.accent` | yes | `#rrggbb`: buttons, progress bars, highlights |
| `theme.glow` | no | three `#rrggbb` colours, dark to bright, used for the background glow while nothing plays. Without them each view uses its own colours. |
| `theme.base` | no | `#rrggbb` window background. It must stay near black (each channel at most `#24`), because text is drawn light on it. |

Glyph's built-in themes, as a starting point:

| Theme | accent | glow | base |
|---|---|---|---|
| Ember | `#ff8a3d` | `#3a1206` `#ff6516` `#ffc04a` | `#050302` |
| Ocean | `#4da3ff` | `#06124a` `#1d5cff` `#46dcff` | `#020308` |
| Forest | `#3ddc84` | `#04210f` `#1f9d55` `#9cf0b8` | `#020503` |

### Several plugins in one repo

Put each manifest in its own folder (`themes/coral/glyph-plugin.json`). Only a manifest at the repo root shows up under **Community**. Plugins in folders appear once they are in this index (`"path": "themes/coral"`).

## Get listed

Open a pull request that adds `plugins/<id>.json`:

```json
{
  "repo": "your-name/glyph-midnight-coral",
  "path": "",
  "rev": "0123456789abcdef0123456789abcdef01234567"
}
```

- `rev` is the full commit hash of the version to list. Glyph installs exactly that version.
- CI fetches the manifest at that commit and checks it (`node scripts/build-index.mjs --check`); for extensions with code it also checks that `main` exists at that commit and is a WebAssembly module of at most 16 MiB. After the merge it rebuilds `index.json`.
- To ship an update, raise `version` in your repo and open a pull request that changes `rev`.

Installed plugins update automatically (unless the user turned that off) when a higher `version` from the same repository shows up. An update that asks for new permissions waits for the user to agree.

## Make an extension

An extension is `"schema": 2, "kind": "extension"` plus any of:

| Field | What it does | Needs code |
|---|---|---|
| `strings` | texts by language: your own (`<id>.…`) and replacements for any of Glyph's | no |
| `hide` | Glyph settings rows to hide, by label key | no |
| `theme` | colours, as for a theme | no |
| `main` | your WebAssembly module (`wasm32-unknown-unknown`, no WASI) | – |
| `permissions` | `playback`, `library`, `search`, `settings`, `network`, `audio`, `lyrics_provider` | yes |
| `network` | hosts the code may contact (`api.example.com`, `*.example.com`) | yes |
| `settings` | your own settings page and sections on Glyph's pages | yes |
| `menus` | entries in the song menu | yes |

Glyph runs the code in a sandbox (an interpreter with a time and memory budget). The code only reaches what its permissions allow, talks to Glyph in JSON, and can't touch your files. Users see every permission before they install, and again when an update asks for more.

Plugins with code install only from **Listed**: open a pull request here once your plugin works. See [the example extension](examples/now-playing) and the [API reference](https://docs.glyph.my/plugins/api).

## License

The tooling and the themes in this repository are MIT. Every plugin states its own license.

## Service setup and local extension APIs

Use secret text settings on the plugin's own page for user-supplied keys.
`required: true` keeps code stopped until setup is saved in secure storage.
Each field needs a `credential` declaration with an exact `host`, `path`,
`location` (`query` or `headers`) and `name`. The stored key is bound to those
values; another endpoint cannot reuse it. Keys have no defaults, never appear in `values.json` or plugin events, and
are not inherited from Glyph. `net.fetch` can inject a declared secret into
query parameters or headers through `credentials`.

See [the own-key Last.fm example](examples/glyph-lastfm-profile) and
[Services and keys](https://docs.glyph.my/plugins/services). Additional local
APIs supply lyrics (`lyrics.publish`), read the audio spectrum and set the
equalizer (`audio.*`), and edit the queue. A `progress` row displays live
values through `ui.update`. None grants raw server, account or admin access.

Run manifest security checks with `node --test scripts/manifest.test.mjs`.
