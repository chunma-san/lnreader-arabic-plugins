# Starless sources

This generator handles Kol Novel's redesigned Starless theme. The existing LightNovelWP parser remains available for sites that still use that layout.

Source definitions retain `kolnovel` and `freekolnovel` and their original icon paths. Both resolve legacy links through the current main host. Bump a source's `version` in `sources.json` when its generated code changes.

The archive uses `paged`, and chapter groups load through the public `kol_series_volume_chapters` endpoint with a nonce read from the novel page. The endpoint's page count is authoritative; the initial HTML can advertise one page even when more exist. `parsePage` maps the site's newest-first pages to ascending chapter order for LNReader.

The existing genre, status and ordering filter definitions are reused from LightNovelWP. Generator output is disposable; edit the template or source definitions instead.

Validation:

```sh
npm run test:arabic
npm run build:arabic
npm run check:arabic -- "KolNovel[starless].ts" "FreeKolNovel[starless].ts"
```

Maintained by [chunma-san](https://github.com/chunma-san), under the repository's MIT license.
