# Security policy

## Reporting a vulnerability in Glyph or the catalog validator

If you found a way for a plugin manifest, theme or WebAssembly module to bypass
Glyph's validation rules (`scripts/manifest.mjs`, `scripts/validate.mjs`,
`scripts/build-index.mjs`), escape the sandbox, or act outside its declared
permissions, report it privately through
**[GitHub Security Advisories](https://github.com/glyphmusic/plugins/security/advisories/new)**
(or on [glyphmusic/apps](https://github.com/glyphmusic/apps/security/advisories/new)).

Do **not** open a public issue or pull request with an exploit.

## Reporting a harmful plugin

Plugins are made by their authors, not by Glyph (see
[Trust and safety](https://docs.glyph.my/plugins/security)).

- **A Listed plugin (`index.json`) that is malicious, breaks the catalog rules or misuses permissions:** open an issue on [glyphmusic/plugins](https://github.com/glyphmusic/plugins/issues) so maintainers can remove it from the index.
- **A Community plugin (`glyph-plugin` topic) that distributes malware, spam or impersonation on GitHub:** use GitHub's **Report repository** button on that repository's page.
- **A bug in a third-party plugin's own features or styling:** open an issue on that plugin's repository.
