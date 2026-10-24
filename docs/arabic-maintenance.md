# Maintaining Arabic sources

Project documentation, tooling messages and automation use English. Arabic is the content language of the sources published by this fork.

## Fix a source

1. Reproduce the problem on the website and in the plugin. Record the novel or chapter used.
2. Edit the source under `plugins/arabic`, or its definition and shared template under `plugins/multisrc` if it is generated. Do not edit generated files with square brackets in their names.
3. Increment the plugin version. For generated sources, use `versionIncrements` or the template version according to the scope of the change.
4. Run `npm run build:arabic` and `npm run check:arabic -- "PluginFile.ts"`. Check formatting and test the result in the app or Playground.
5. Review outgoing files before pushing to this fork's `master` branch. A successful build publishes the catalog to `plugins/v3.0.0`.

An existing source's health failure does not remove it automatically or block publication of a fix for another source. Health reports do not modify source code. Build validation checks the package; live-site and app testing establish whether a plugin works.

## Add a site

- Check `BLACKLIST.json` first.
- Reuse a suitable generator and set the source language to `Arabic`. Put standalone TypeScript plugins under `plugins/arabic`.
- Choose a stable, unique ID and add the public icon as described in the [quick start guide](quickstart.md).
- Test search, pagination, chapter order, metadata, images and chapter content. Publication rejects duplicate IDs and missing assets.

## Follow upstream

`upstream.json` records the last reviewed upstream commit. The daily check links to a comparison when upstream changes. To sync, review the difference, fetch `master` from `LNReader/lnreader-plugins` and merge the relevant changes into a working branch in this fork. Resolve conflicts while preserving Arabic source fixes, then rerun the checks before publishing. Update `reviewedCommit` to the commit that was actually reviewed.

Custom code is never replaced by an automatic upstream sync. No issues, comments or pull requests are submitted upstream without a separate request from the owner.

## Health reports

The scheduled check runs daily at 03:40 UTC and can also be started manually from Actions. It checks Arabic sources sequentially to limit traffic, and retains a JSON report and readable summary for 14 days. Results cover the tested samples, not every novel, chapter or network.

- `PASS`: the sampled reading flow succeeded.
- `FAIL`: the plugin returned invalid data or encountered an error that needs investigation.
- `INCONCLUSIVE`: the check could not establish the result, for example because of a network failure or site protection.

Unused inherited workflows stay disabled in this fork's settings. The dedicated workflows are Publish Arabic Plugins and Arabic Plugin Health.

## Attribution and license

Maintained by [chunma-san](https://github.com/chunma-san), preserving original authorship and the MIT license. Any future upstream contribution must follow upstream's requirements, including disclosure of AI assistance in a commit or PR description when applicable.
