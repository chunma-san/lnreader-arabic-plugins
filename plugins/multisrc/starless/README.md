# Starless sources

This generator handles Kol Novel's redesigned Starless theme. The existing LightNovelWP parser remains available for sites that still use that layout.

The active source retains `kolnovel` and its original icon path. Legacy links resolve through the current main host. Free Kol Novel is retired because it uses the same site. Bump a source's `version` in `sources.json` when its generated code changes.

The archive uses `paged`, and chapter groups load through the public `kol_series_volume_chapters` endpoint with a nonce read from the novel page. Novel metadata does not wait for chapter requests. Page counts come from each volume's displayed chapter count and the site's 50-row page size; the HTML's `data-kol-volume-pages` placeholder can be incorrect. `parsePage` fetches only the requested page, verifies the endpoint's page count and maps newest-first pages to ascending chapter order for LNReader. Listing and detail covers use appropriately sized `srcset` thumbnails and encoded URLs.

The existing genre, status and ordering filter definitions are reused from LightNovelWP. Generator output is disposable; edit the template or source definitions instead.

Validation:

```sh
npm run test:arabic
npm run build:arabic
npm run check:arabic -- "KolNovel[starless].ts"
```

Maintained by [chunma-san](https://github.com/chunma-san), under the repository's MIT license.
