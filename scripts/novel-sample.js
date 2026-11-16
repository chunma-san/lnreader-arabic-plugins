export async function loadNovelSample(plugin, candidates, run) {
  let emptyCount = 0;
  for (const candidate of candidates.slice(0, 3)) {
    const novel = await run(plugin.parseNovel(candidate.path), 'parseNovel');
    if (!novel?.name) throw new Error('Missing novel name');
    let chapters = novel.chapters;
    if (
      typeof plugin.parsePage === 'function' &&
      (chapters === undefined ||
        (Array.isArray(chapters) && chapters.length === 0))
    ) {
      const page = await run(
        plugin.parsePage(candidate.path, '1'),
        'parsePage',
      );
      chapters = page?.chapters;
    }
    if (!Array.isArray(chapters)) throw new Error('Missing chapter list');
    if (chapters.length) return { novel: { ...novel, chapters }, emptyCount };
    emptyCount++;
  }
  throw new Error(`No chapters returned from ${emptyCount} sampled novels`);
}
