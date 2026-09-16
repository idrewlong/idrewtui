# Fonts

`Commit Mono` (OFL) is self-hosted here and referenced by `--font-mono` in
`app/assets/css/tokens.css`.

TODO(andrew): drop the woff2 files in this directory and add the matching
`@font-face` rules. Until then the fallback stack
(`ui-monospace, "SF Mono", Menlo, Consolas, monospace`) is used, which is why
nothing is broken without them.

Expected files:

- `commit-mono-400.woff2` (regular)
- `commit-mono-600.woff2` (semibold — used for keys and headings)

Use `font-display: swap` so text is never invisible while a face loads.
