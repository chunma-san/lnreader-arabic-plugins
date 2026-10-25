# Riwyat loading and compatibility

Maintained in this Arabic fork by [chunma-san](https://github.com/chunma-san).

The review of upstream [issue #2505](https://github.com/lnreader/lnreader-plugins/issues/2505), [PR #2529](https://github.com/lnreader/lnreader-plugins/pull/2529) and [PR #2586](https://github.com/lnreader/lnreader-plugins/pull/2586) distinguishes website rejection from parser failures. The proposals remain upstream work by their original authors; this fork adapts relevant behavior without merging unrelated source changes.

Riwyat supports NHV metadata, chapter-page fallback when AJAX contains no chapter rows, story-layer and novel-chapter bodies, illustration-only chapters, and hidden/promotion cleanup. Paragraphs, headings, lists, images and ordinary section text are preserved. Missing content raises an error rather than saving a blank chapter. Novel metadata remains independent of the chapter request.

HTTP 403 occurs before these parsers can run. The plugin's Last loading diagnostic setting reports the status, a short page title and a classification based on known challenge/captcha/region-restriction markers. Classification is a hint, not proof of the server policy. It does not record cookies, authorization headers, full HTML or URL queries and does not send diagnostics anywhere. This version does not claim to bypass or resolve the reported on-device rejection.

Update Riwyat, open an affected novel, then copy Last loading diagnostic from the plugin settings. No device security settings need to be changed for this check.
