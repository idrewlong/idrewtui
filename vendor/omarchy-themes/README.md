# Vendored Omarchy themes

Palettes from [Omarchy](https://github.com/basecamp/omarchy), MIT licensed,
© David Heinemeier Hansson. `LICENSE` is the upstream copy.

Vendored rather than fetched so builds are reproducible offline and a palette
never changes under us without a visible diff.

`scripts/generate-themes.mjs` maps these onto our semantic tokens and tunes any
token that fails WCAG AA. See the spec §6 for the mapping. To resync, re-copy
the `colors.toml` files and run `pnpm generate-themes`.
