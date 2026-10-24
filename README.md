<!-- CAT-COUNTER:START -->
<p align="center">
  <img src="https://count.himiku.com/@chunma-lnreader-arabic-plugins?theme=capoo-2&amp;padding=6&amp;scale=0.8&amp;darkmode=1" alt="Cat visits counter" />
</p>
<!-- CAT-COUNTER:END -->

# LNReader Arabic Plugins

[![Build](https://github.com/chunma-san/lnreader-arabic-plugins/actions/workflows/publish-plugins.yml/badge.svg)](https://github.com/chunma-san/lnreader-arabic-plugins/actions/workflows/publish-plugins.yml)
[![Source health](https://github.com/chunma-san/lnreader-arabic-plugins/actions/workflows/arabic-health.yml/badge.svg)](https://github.com/chunma-san/lnreader-arabic-plugins/actions/workflows/arabic-health.yml)

An independent [LNReader Plugins](https://github.com/LNReader/lnreader-plugins) fork focused on Arabic novel sources. This is where we track broken sources, maintain fixes and add new sites.

## Add to LNReader

Add this URL to the plugin repository list in LNReader:

```text
https://raw.githubusercontent.com/chunma-san/lnreader-arabic-plugins/plugins/v3.0.0/.dist/plugins.min.json
```

Refresh the plugin list, then install the sources you want. This repository provides plugins for LNReader; it does not replace the app.

Plugins keep their original IDs. If you also use the upstream repository, the same source may appear in both lists. Choose this fork's version for sources you want to follow here. Back up your library before switching an existing source.

## What's included

- An Arabic-only plugin catalog, including Kol Novel and Riwyat.
- Automatic builds when sources or build tools change, with plugin and asset validation before publication.
- Daily checks of Arabic sources: novel listings, search, novel details and a sample chapter.
- Reports that distinguish successful checks, failures that need investigation and inconclusive network or anti-bot results.

See [ARABIC_SOURCES.md](ARABIC_SOURCES.md) for the source list and known issues. A source being listed does not mean it currently works. The [Arabic Plugin Health](https://github.com/chunma-san/lnreader-arabic-plugins/actions/workflows/arabic-health.yml) run summaries and `arabic-source-health` artifacts contain the latest check results.

## Development

Use Node.js 22 or newer and npm:

```sh
npm ci --ignore-scripts
npm run build:arabic
npm run check:arabic
```

To check one source, pass its filename:

```sh
npm run check:arabic -- "Riwyat[madara].ts"
```

Upstream source, shared generators and commit history are retained to make reviewed updates easier. Only Arabic plugins and their required assets are built and published here. The daily workflow compares upstream with `upstream.json`; changes are reviewed before merging so local fixes survive.

For source fixes and new sites, read the [maintenance guide](docs/arabic-maintenance.md) and [plugin API documentation](docs/docs.md). Project documentation and automation use English; the plugin catalog is limited to Arabic content sources.

## Maintainer and credits

Maintained by [chunma-san](https://github.com/chunma-san). Based on the work of [LNReader Plugins](https://github.com/LNReader/lnreader-plugins) developers and contributors, with original authorship and the [MIT license](LICENSE) preserved.

This fork is independent of LNReader and the content providers. The [source blacklist](BLACKLIST.json) is retained and checked before adding new sites. No upstream pull requests or comments are submitted automatically.
