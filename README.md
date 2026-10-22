# Glyph plugins

Plugins for [Glyph](https://github.com/glyphmusic/apps). For now these are colour themes. Glyph finds them under **Settings → Plugins**, and they are listed on [glyph.my/plugins](https://glyph.my/plugins).

**Full documentation: [docs.glyph.my/plugins](https://docs.glyph.my/plugins)**: [quickstart](https://docs.glyph.my/plugins/quickstart), [how plugins work](https://docs.glyph.my/plugins/how-it-works), [manifest reference](https://docs.glyph.my/plugins/manifest), [designing a theme](https://docs.glyph.my/plugins/themes), [testing](https://docs.glyph.my/plugins/testing), [publishing](https://docs.glyph.my/plugins/publishing), [troubleshooting](https://docs.glyph.my/plugins/troubleshooting).

Fastest start: **[use the plugin template](https://github.com/glyphmusic/plugin-template/generate)**.

Glyph looks for plugins in two places. It fetches both straight from GitHub on your device, without the Glyph server:

| Section in Glyph | Source | Can install |
|---|---|---|
| **Listed** | `index.json` in this repo. Each version is checked against the plugin rules (valid file, pinned version) before it is added. | everything |
| **Community** | every GitHub repo with the topic [`glyph-plugin`](https://github.com/topics/glyph-plugin). Nobody checks these. | themes only, because themes contain no code |

Glyph caches the list for an hour. **Refresh** loads it again.

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
| `schema` | no | `1` |
| `id` | yes | 2–40 characters: `a-z`, `0-9` and single dashes. It must be unique, so pick something specific. |
| `name` | yes | up to 40 characters |
| `version` | yes | semantic version (`1.0.0`). Raise it to ship an update. |
| `author`, `license` | no | up to 40 characters each |
| `description` | no | up to 200 characters |
| `min_app` | no | oldest Glyph version the plugin needs (`0.7.0`) |
| `kind` | yes | `"theme"` |
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
- CI fetches the manifest at that commit and checks it (`node scripts/build-index.mjs --check`). After the merge it rebuilds `index.json`.
- To ship an update, raise `version` in your repo and open a pull request that changes `rev`.

Installed plugins update automatically (unless the user turned that off) when a higher `version` from the same repository shows up.

## Coming later

Plugins with code (lyrics sources, scrobblers, metadata, visualizers) will run as sandboxed WebAssembly with permissions you grant. They will only be installable from **Listed**.

## License

The tooling and the themes in this repository are MIT. Every plugin states its own license.
