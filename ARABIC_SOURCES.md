# Arabic sources

This is the initial build inventory. Source parsers were not changed while setting up the fork. Check the daily Actions reports for the latest sampled source health.

| Source | ID | Version |
| --- | --- | --- |
| [ArNovel](https://ar-no.com/) | `arnovel` | 2.3.0 |
| [Azora](https://azoramoon.com/) | `azora` | 2.3.0 |
| [Azora Manga](https://azorafly.com/) | `azorafly` | 1.0.0 |
| [dilar tube](https://golden.rest/) | `dilartube` | 1.0.2 |
| [Free Kol Novel](https://free.kolnovel.com/) | `freekolnovel` | 1.1.12 |
| [Galaxy Novels](https://galaxynovels.com/) | `galaxynovels` | 1.1.1 |
| [HizoManga](https://hizomanga.net/) | `hizomanga` | 2.3.0 |
| [Kol Novel](https://kolnovel.com/) | `kolnovel` | 1.1.22 |
| [Markaz Riwayat](https://markazriwayat.com/) | `markazriwayat` | 1.0.0 |
| [Mamlakat Al Riwayat](https://mknov.com) | `mknov` | 1.0.0 |
| [Maktabat Al Khayal](https://mtlarabic.com) | `mtlarabic` | 1.0.0 |
| [Novel4Up](https://novel4up.com/) | `novel4up` | 2.3.0 |
| [Novels Paradise](https://novelsparadise.site/) | `novelsparadise` | 1.1.12 |
| [Olaoe.cyou](https://olaoe.cyou/) | `olaoe` | 2.3.0 |
| [Rewayah Fans](https://rewayahfans.net/) | `rewayahfans` | 1.0.0 |
| [Rewayat Club](https://rewayat.club/) | `rewayatclub` | 1.0.3 |
| [Rewayat Fans](https://rewayatfans.com/) | `rewayatfans` | 4.2.0 |
| [Riwyat](https://cenele.com/) | `riwyat` | 2.3.0 |
| [Seanovel](https://seanovel.org/) | `seanovel` | 1.0.0 |
| [Sunovels](https://sunovels.com/) | `sunovels` | 1.0.1 |

## Reproduced baseline issues

On 2026-10-24, Kol Novel returned an empty novel list after a website redesign, and Free Kol Novel rejected the redirect to the main site. Riwyat passed listings and search, then failed to extract the novel name on the details page. These are known issues, not completed fixes.

The inventory records included sources and versions. A successful build does not establish that every source works; use the health reports for live-check results.
