# Local Agent Bot avatars

Forty transparent 256×256 PNGs cover the 20 bot keys in light and dark themes.
Filenames are `<key>-light.png` and `<key>-dark.png`. Claude uses its ordinary
brand mark in both themes; the other 19 keys use the static upstream robot
renderer. The export command, upstream provenance, and license mapping are in
`../../../vendor/agent-hud-artwork/README.md`.

Verify the exported files against `SHA256SUMS.txt` with:

```sh
(cd renderer/assets/agent-hud && shasum -a 256 -c SHA256SUMS.txt)
```
