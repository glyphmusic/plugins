# Glyph plugins

Plugins for [Glyph](https://github.com/glyphmusic/apps): colour themes, looks and extensions. Extensions can rename any text, hide settings, add their own settings page, sections on Glyph's pages and song menu entries, and run code (WebAssembly, in a sandbox) that controls playback, the library, search and settings and talks to the web, as far as its permissions allow. Glyph finds plugins under **Settings → Plugins**, and they are listed on [glyph.my/plugins](https://glyph.my/plugins).

**Full documentation: [docs.glyph.my/plugins](https://docs.glyph.my/plugins)**: [quickstart](https://docs.glyph.my/plugins/quickstart), [extensions](https://docs.glyph.my/plugins/extensions), [API reference](https://docs.glyph.my/plugins/api), [settings and menus](https://docs.glyph.my/plugins/settings-ui), [how plugins work](https://docs.glyph.my/plugins/how-it-works), [manifest reference](https://docs.glyph.my/plugins/manifest), [designing a theme](https://docs.glyph.my/plugins/themes), [looks](https://docs.glyph.my/plugins/looks), [testing](https://docs.glyph.my/plugins/testing), [publishing](https://docs.glyph.my/plugins/publishing), [troubleshooting](https://docs.glyph.my/plugins/troubleshooting).

Fastest start: **[use the plugin template](https://github.com/glyphmusic/plugin-template/generate)** for a theme, or copy **[the example extension](examples/now-playing)** (Rust) for code.

Glyph looks for plugins in two places. It fetches both straight from GitHub on your device, without the Glyph server:

| Section in Glyph | Source | Can install |
|---|---|---|
| **Listed** | `index.json` in this repo. Each version is checked against the plugin rules (valid file, pinned version) before it is added. | everything |
| **Community** | every GitHub repo with the topic [`glyph-plugin`](https://github.com/topics/glyph-plugin). Nobody checks these. | plugins without code only (themes, looks, texts, hidden rows) |

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

## Add a look

A theme changes colours. A **look** can change the whole interface: the font, how round corners are, Glyph's icons, the app icon, background pictures and a style sheet. Add a `look` object to a theme or an extension. It is pure data (no code), so it also installs from **Community**. Looks need Glyph 0.12.11 or newer, so set `"min_app": "0.12.11"`.

```json
"look": {
  "font": "fonts/MyFont.woff2",
  "app_icon": "icon.png",
  "radius": 1.6,
  "backgrounds": ["backgrounds/night.webp"],
  "css": "look.css",
  "assets": ["textures/grain.png"],
  "icons": { "heart": "icons/heart.svg", "heart-fill": "icons/heart-fill.svg" }
}
```

Every field is optional, but a look needs at least one. File paths are relative to the manifest.

| Field | Rules |
|---|---|
| `font` | the font for all text: `inter` (Glyph's), `system`, `rounded`, `serif` or `mono` (from the system), or the path of your own font file (`.woff2`, `.woff`, `.ttf`, `.otf`, at most 2 MB). Own font files need Glyph 0.13.6 or newer. |
| `mono` | the monospaced font (numbers, ASCII art), like `font`. Needs Glyph 0.13.6 or newer. |
| `home`, `sidebar`, `tabs` | put parts in a new order or hide them: `{"order": ["mixes", "recent"], "hide": ["trending"]}`. Home page: `greeting`, `cards`, `recent`, `new_releases`, `mixes`, `recs`, `trending`. Sidebar: `home`, `search`, `library`, `now_playing`, `lists` (Settings always stays). Phone tabs: `home`, `search`, `library`. Needs Glyph 0.13.6 or newer. |
| `app_icon` | your own app icon: a square `.png`, 64 to 1024 pixels, at most 1 MB. Glyph shows it on the window, taskbar, tray and Dock (on Android in the app overview) while the look is in use. Needs Glyph 0.13.6 or newer. |
| `radius` | `0` to `2`: how round corners are. `0` square, `1` Glyph's (10 px), `2` very round. |
| `backgrounds` | up to 8 pictures (`.png`, `.jpg`, `.webp`, at most 8 MB each). People pick them in **Settings › Appearance › Background picture**; a look never switches the background by itself. |
| `css` | a `.css` file, at most 128 KB, added after Glyph's own styles for every window, menu and dialog. |
| `assets` | up to 40 files the style sheet may use with `url()`: fonts (`.woff2`, `.woff`, `.ttf`, `.otf`) and pictures (`.png`, `.jpg`, `.webp`, `.gif`, `.svg`), at most 2 MB each. |
| `icons` | Glyph icons to replace: icon name → `.svg` file (at most 32 KB). Names are the file names in [Glyph's icon folder](https://github.com/glyphmusic/apps/tree/main/assets/icons/ui) without `.svg`. Glyph draws the icon in the text colour, so only the shape counts. Toggles use `<name>-fill` when on (`heart-fill`), so replace both. |

All files of one look together may have 32 MB.

A theme's look shows while that theme is picked. An extension's look shows while the extension is on. **Settings › Plugins** always looks like Glyph, so a look can always be turned off there (`Ctrl+Alt+P` opens it from anywhere).

### The style sheet

Glyph's class names can change in any version. Use these hooks instead, which stay: `:root` (set variables here), `[data-skin]` (the main window) and `[data-part="…"]` with `titlebar`, `sidebar`, `page`, `side-panel`, `player-bar`, `settings`, `menu`, `dialog`, `toasts`, `tooltip`, `mini-player`, `tab-bar`, `mini-bar` or `now-playing`. Useful variables: `--font`, `--radius`, `--accent`, `--panel`, `--card`, `--border`, `--gap`. The full list is in [Looks](https://docs.glyph.my/plugins/looks).

```css
:root { --border: rgba(255, 183, 208, .22); }
[data-part="player-bar"] { border-radius: calc(var(--radius) * 2); }
```

A look never loads anything from the internet. Glyph refuses a style sheet that:

- uses `url()` for anything but a file in `assets` (no web addresses, no `data:`),
- uses `@import`, `@namespace`, `@charset`, `image-set(`, `image(`, `src(`, `element(`, `expression(`, `javascript:`, `-moz-binding` or `behavior:`,
- contains a backslash (`\`) or `<`,
- is not UTF-8, or has unbalanced `{ }`, an unclosed comment or an unclosed string.

Check your look with `node scripts/validate.mjs path/to/glyph-plugin.json`. It also checks that every file exists, has the right type and is not too big. [Sakura](themes/sakura) is an example theme with a look.

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
- CI fetches the manifest at that commit and checks it (`node scripts/build-index.mjs --check`); for a look it also checks every file of the look; for extensions with code it also checks that `main` exists at that commit and is a WebAssembly module of at most 16 MiB. After the merge it rebuilds `index.json`.
- To ship an update, raise `version` in your repo and open a pull request that changes `rev`.

Installed plugins update automatically (unless the user turned that off) when a higher `version` from the same repository shows up. An update that asks for new permissions waits for the user to agree.

## Make an extension

An extension is `"schema": 2, "kind": "extension"` plus any of:

| Field | What it does | Needs code |
|---|---|---|
| `strings` | texts by language: your own (`<id>.…`) and replacements for any of Glyph's | no |
| `hide` | Glyph settings rows to hide, by label key | no |
| `theme` | colours, as for a theme | no |
| `look` | font, corners, icons, background pictures and a style sheet ([see above](#add-a-look)) | no |
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
