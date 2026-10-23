# Last.fm profile example

A local extension that reads a public Last.fm profile using **your own** API key.
It demonstrates required credentials and host-side query injection. It does not
use Glyph's Last.fm key, server, account or login tokens. It is not a scrobbler.

1. Create your own key at https://www.last.fm/api/account/create.
2. Build with `cargo build --release --target wasm32-unknown-unknown`.
3. Copy `target/wasm32-unknown-unknown/release/glyph_lastfm_profile.wasm` to `plugin.wasm`.
4. Copy the manifest and `plugin.wasm` to Glyph's plugins folder in `glyph-lastfm-profile/`.
5. Reload plugins. Glyph opens setup after an install; for a local copy, open this plugin's settings.
6. Enter your key in the masked field and press Enter. The code starts after the required key is saved.
7. Enter a Last.fm user name and click Load profile.

The key is saved in OS secure storage. If secure storage is unavailable, setup
fails instead of writing a plaintext fallback. The plugin receives a configured
flag, not the key. `net.fetch` inserts it into requests to the declared Last.fm
host at `/2.0/`, in the `api_key` query field only. The key's secure-storage
entry is bound to that declaration; changing it requires new setup. Last.fm
receives that key; choose plugin authors and network hosts you trust.
Remove the key by submitting an empty key field. Removing the plugin deletes its declared keys.

The source example has no prebuilt module. The regular manifest validator also
checks for `plugin.wasm`; build it before using that validator or publishing.
API reference: https://www.last.fm/api/show/user.getInfo
Authenticated writes such as scrobbling require Last.fm's separate authorization
and signing flow; this example does not implement those steps.
