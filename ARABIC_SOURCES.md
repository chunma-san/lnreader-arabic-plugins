# Arabic sources

This inventory includes the maintained Arabic sources and their current versions. Check the daily Actions reports for the latest sampled source health.

| Source | ID | Version |
| --- | --- | --- |
| [ArNovel](https://ar-no.com/) | `arnovel` | 2.3.0 |
| [Azora](https://azoramoon.com/) | `azora` | 2.3.0 |
| [Azora Manga](https://azorafly.com/) | `azorafly` | 1.0.0 |
| [dilar tube](https://golden.rest/) | `dilartube` | 1.0.2 |
| [Free Kol Novel](https://free.kolnovel.com/) | `freekolnovel` | 1.2.0 |
| [Galaxy Novels](https://galaxynovels.com/) | `galaxynovels` | 1.1.1 |
| [HizoManga](https://hizomanga.net/) | `hizomanga` | 2.3.0 |
| [Kol Novel](https://kolnovel.com/) | `kolnovel` | 1.2.0 |
| [Markaz Riwayat](https://markazriwayat.com/) | `markazriwayat` | 1.0.0 |
| [Mamlakat Al Riwayat](https://mknov.com) | `mknov` | 1.0.0 |
| [Maktabat Al Khayal](https://mtlarabic.com) | `mtlarabic` | 1.0.0 |
| [Novel4Up](https://novel4up.com/) | `novel4up` | 2.3.0 |
| [Novels Paradise](https://novelsparadise.site/) | `novelsparadise` | 1.1.12 |
| [Olaoe.cyou](https://olaoe.cyou/) | `olaoe` | 2.3.0 |
| [Rewayah Fans](https://rewayahfans.net/) | `rewayahfans` | 1.0.0 |
| [Rewayat Club](https://rewayat.club/) | `rewayatclub` | 1.0.3 |
| [Rewayat Fans](https://rewayatfans.com/) | `rewayatfans` | 4.2.0 |
| [Riwyat](https://cenele.com/) | `riwyat` | 2.3.1 |
| [Seanovel](https://seanovel.org/) | `seanovel` | 1.0.0 |
| [Sunovels](https://sunovels.com/) | `sunovels` | 1.0.1 |

## Reproduced baseline issues

On 2026-10-24, Kol Novel returned an empty novel list after a website redesign, and Free Kol Novel rejected the redirect to the main site. Riwyat passed listings and search, then failed to extract the novel name on the details page. These failures were recorded before the source fixes below.

The inventory records included sources and versions. A successful build does not establish that every source works; use the health reports for live-check results.

## Source fixes: 2026-10-25

- Kol Novel and Free Kol Novel 1.2.0 use the site's Starless layout and public chapter-index endpoint. Listings, search, metadata and paginated chapters keep the original plugin IDs and relative chapter paths. The legacy free host resolves to the current main site.
- Riwyat 2.3.1 reads the NHV title, cover, summary and status, removes duplicate chapter paths and extracts the story content without reader controls or hidden decoy text. If the chapter endpoint returns no chapter rows, it retains the novel page's chapter list.
- Live checks passed listings, search, details and a chapter for all three sources. Additional checks found 75 unique ordered Kol Novel chapters across two pages, and 3,227 unique Shadow Slave chapters on Riwyat. Phone verification is still needed.
- Offline regression checks cover listing markup changes, chapter pagination, deduplication, invalid endpoint responses, image retention and chapter cleanup. Run them with `npm run test:arabic`.
