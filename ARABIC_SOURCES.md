# Arabic sources

This inventory includes the maintained Arabic sources and their current versions. Check the daily Actions reports for the latest sampled source health.

| Source | ID | Version |
| --- | --- | --- |
| [ArNovel](https://ar-no.com/) | `arnovel` | 2.3.0 |
| [Azora](https://azoramoon.com/) | `azora` | 2.3.0 |
| [Azora Manga](https://azorafly.com/) | `azorafly` | 1.0.0 |
| [dilar tube](https://golden.rest/) | `dilartube` | 1.0.3 |
| [Galaxy Novels](https://galaxynovels.com/) | `galaxynovels` | 1.2.0 |
| [HizoManga](https://hizomanga.net/) | `hizomanga` | 2.3.0 |
| [Kol Novel](https://kolnovel.com/) | `kolnovel` | 1.2.2 |
| [Markaz Riwayat](https://galaxynovels.com/) | `markazriwayat` | 2.0.0 |
| [Mamlakat Al Riwayat](https://mknov.com) | `mknov` | 1.0.0 |
| [Maktabat Al Khayal](https://mtlarabic.com) | `mtlarabic` | 1.0.0 |
| [Novel4Up](https://novel4up.com/) | `novel4up` | 2.3.0 |
| [Novels Paradise](https://novelsparadise.site/) | `novelsparadise` | 1.1.12 |
| [Olaoe.cyou](https://olaoe.cyou/) | `olaoe` | 2.3.0 |
| [Rewayah Fans](https://rewayahfans.net/) | `rewayahfans` | 1.0.0 |
| [Rewayat Club](https://rewayat.club/) | `rewayatclub` | 1.0.3 |
| [Rewayat Fans](https://rewayatfans.com/) | `rewayatfans` | 4.2.0 |
| [Riwyat](https://cenele.com/) | `riwyat` | 2.3.5 |
| [Seanovel](https://seanovel.org/) | `seanovel` | 1.2.1 |
| [Sunovels](https://sunovels.com/) | `sunovels` | 1.0.1 |

## Reproduced baseline issues

### Reviewed updates: 2026-11-07

- Reviewed upstream `a2bd6dd` for Madara volume ordering, but deferred it after review found regressions with paginated volumes and hidden chapters. This fork's Riwyat ordering, deduplication, diagnostics and on-demand loading remain intact.
- Applied upstream `9a2948b` for Seanovel's string-aware RSC paragraph parser. Offline checks cover brackets, escaped quotes and backslashes. Listings, search, details and a sample chapter passed live checks for Seanovel and Riwyat.
- These are selected upstream changes, not a full upstream merge; `upstream.json` still records the last complete review. Original upstream contributor credit is retained in the commit message.
- Azora and Markaz Riwayat's legacy endpoints still fail; the current `azorafly` and `galaxynovels` plugins work in sampled checks. Novel4Up's domain now serves an unrelated portfolio, and Novels Paradise could not be resolved. No replacement domain is inferred and existing library IDs are retained. Their failing or inconclusive health results remain visible.

### Live investigation: 2026-11-02

- Kol Novel 1.2.2 uses the current aggregate chapter index and its declared page count. This avoids counting arc chapters twice and supports the site's new page size. Listings, search, details and a sample chapter passed a live check; offline tests also verify all 87 chapters across four pages in the current layout.
- dilar tube 1.0.3 sends search to the current `golden.rest` host. Listings, novel details and a sample chapter passed. Search currently returns HTTP 503 because the site reports read-only maintenance; the plugin preserves that status rather than trying to parse an HTML response from the old domain.
- Azora's old host redirects to Azora Manga, already included as `azorafly`. Its old novel listing URL returns 404. Markaz Riwayat redirects to Galaxy Novels, already included as `galaxynovels`, and its old listing URL also returns 404. These legacy sources retain their IDs and paths for existing libraries; they are not silently redirected to unrelated parser layouts.
- Novel4Up requested a CAPTCHA and Novels Paradise returned HTTP 403. These checks do not establish working access. The daily report keeps unresolved failures visible; publication is not evidence that every website works.

On 2026-10-24, Kol Novel returned an empty novel list after a website redesign, and Free Kol Novel rejected the redirect to the main site. Riwyat passed listings and search, then failed to extract the novel name on the details page. These failures were recorded before the source fixes below.

The inventory records included sources and versions. A successful build does not establish that every source works; use the health reports for live-check results.

## Source fixes: 2026-10-25

- Kol Novel and Free Kol Novel 1.2.0 use the site's Starless layout and public chapter-index endpoint. Listings, search, metadata and paginated chapters keep the original plugin IDs and relative chapter paths. The legacy free host resolves to the current main site.
- Riwyat 2.3.1 reads the NHV title, cover, summary and status, removes duplicate chapter paths and extracts the story content without reader controls or hidden decoy text. If the chapter endpoint returns no chapter rows, it retains the novel page's chapter list.
- Live checks passed listings, search, details and a chapter for all three sources. Additional checks found 75 unique ordered Kol Novel chapters across two pages, and 3,227 unique Shadow Slave chapters on Riwyat. Phone verification is still needed.
- Offline regression checks cover listing markup changes, chapter pagination, deduplication, invalid endpoint responses, image retention and chapter cleanup. Run them with `npm run test:arabic`.

## Kol Novel loading improvements: 2026-10-25

Kol Novel 1.2.1 returns novel details without fetching chapter pages first. Chapter pages load on demand, and listing covers use small images from the site's `srcset` with properly encoded URLs. Detail covers use a larger thumbnail instead of the full image.

Free Kol Novel has been removed from the active catalog because it redirects to Kol Novel. Existing Kol Novel links and IDs are preserved. If the retired plugin is already installed, it may remain in the app's installed list; move any library entries you still use to Kol Novel before removing it.

## Markaz migration: 2026-11-08

Maintained by [chunma-san](https://github.com/chunma-san). Markaz now redirects to Galaxy Novels. One shared Wor Reader generator supplies Galaxy 1.2.0 and Markaz 2.0.0, adapting the existing Galaxy parser for the legacy Markaz plugin ID and icon, including listings, search, chapter indexes and content. Relative library paths with or without a leading slash are accepted; individual removed titles cannot be restored by the plugin. Original LNReader source attribution and license remain unchanged.

Saved numeric Markaz chapter URLs are requested as URLs, not interpreted as Galaxy post IDs. Whether a particular old numeric URL redirects correctly depends on the site; no complete mapping of old chapters has been verified.
