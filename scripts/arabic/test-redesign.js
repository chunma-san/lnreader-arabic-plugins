import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { load } from 'cheerio';
import './generate.js';

const require = createRequire(import.meta.url);
async function plugin(file) {
  const result = await build({
    entryPoints: [`plugins/arabic/${file}`],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    write: false,
    alias: { '@libs': './src/libs', '@': './src' },
  });
  fs.mkdirSync('.arabic-health', { recursive: true });
  const temporary = `${process.cwd()}/.arabic-health/regression.cjs`;
  fs.writeFileSync(temporary, result.outputFiles[0].text);
  try {
    return require(temporary).default;
  } finally {
    delete require.cache[require.resolve(temporary)];
    fs.unlinkSync(temporary);
  }
}

const originalFetch = globalThis.fetch;
const response = (url, body) => {
  const result = new Response(body);
  Object.defineProperty(result, 'url', { value: String(url) });
  return result;
};
const row = number =>
  `<li data-kol-chapter-row><a href="https://kolnovel.com/chapter-${number}/"><span data-kol-chapter-number="${number}">${number}</span><span data-kol-chapter-title>Chapter ${number}</span><time datetime="2026-10-24"/></a></li>`;
const pages = [
  Array.from({ length: 50 }, (_, i) => row(75 - i)).join(''),
  Array.from({ length: 25 }, (_, i) => row(25 - i)).join(''),
];
let listingPage;
try {
  globalThis.fetch = async url => {
    const parsed = new URL(url);
    if (parsed.pathname === '/series/') {
      listingPage = parsed.searchParams.get('paged');
      return response(
        url,
        '<article><h3><a class="title" href="/series/test/" title="Test novel">Test novel</a></h3><img src="cover.jpg"></article>',
      );
    }
    if (parsed.pathname === '/series/test/') {
      return response(
        url,
        '<h1 class="kol-series-editorial__title">Test novel</h1><div data-kol-chapter-index data-kol-volume-url="/wp-admin/admin-ajax.php" data-kol-volume-nonce="fixture" data-kol-series-id="1"><details data-kol-chapter-volume="" data-kol-volume-pages="1"></details></div>',
      );
    }
    if (parsed.pathname === '/wp-admin/admin-ajax.php') {
      return response(
        url,
        JSON.stringify({
          success: true,
          data: {
            html: pages[Number(parsed.searchParams.get('page')) - 1],
            pages: 2,
          },
        }),
      );
    }
    if (parsed.pathname === '/chapter-1/') {
      return response(
        url,
        '<article class="epcontent"><p>Readable paragraph.</p><img data-src="/illustration.png" onerror="bad()"><script>bad()</script></article>',
      );
    }
    return response(url, '<main>No chapter here</main>');
  };
  const kol = await plugin('KolNovel[starless].ts');
  assert.equal((await kol.popularNovels(2, {})).length, 1);
  assert.equal(listingPage, '2');
  const novel = await kol.parseNovel('/series/test/');
  assert.equal(novel.totalPages, 2);
  const all = [
    ...novel.chapters,
    ...(await kol.parsePage('/series/test/', '2')).chapters,
  ];
  assert.equal(all.length, 75);
  assert.equal(new Set(all.map(chapter => chapter.path)).size, 75);
  assert.deepEqual(
    all.map(chapter => chapter.chapterNumber),
    Array.from({ length: 75 }, (_, i) => i + 1),
  );
  assert.equal((await kol.parsePage('/series/test/', '3')).chapters.length, 0);
  const content = load(await kol.parseChapter('/chapter-1/'));
  assert.equal(
    content('img').attr('src'),
    'https://kolnovel.com/illustration.png',
  );
  assert.equal(content('script, [onerror]').length, 0);
  await assert.rejects(kol.parseChapter('/not-a-chapter/'), /unavailable/);
  const free = await plugin('FreeKolNovel[starless].ts');
  assert.equal(free.id, 'freekolnovel');
  assert.equal(
    free.resolveUrl('https://free.kolnovel.com/chapter-1/'),
    'https://kolnovel.com/chapter-1/',
  );
  console.log(
    'PASS: redesigned listing, real page counts, 75 unique ordered chapters, images, invalid pages and legacy host',
  );

  const details =
    '<h1 class="nhv-novel-title">Fixture novel</h1><div class="nhv-novel-cover"><img src="https://cenele.com/cover.jpg"></div><div class="nhv-novel-status"><strong>مستمرة</strong></div><div class="nhv-novel-synopsis">Fixture summary</div><li class="wp-manga-chapter"><a href="https://cenele.com/cont/test/chapter-1/">Chapter 1</a></li>';
  let ajax =
    '<li class="wp-manga-chapter"><a href="https://cenele.com/cont/test/chapter-2/">Chapter 2</a></li>'.repeat(
      2,
    ) +
    '<li class="wp-manga-chapter"><a href="https://cenele.com/cont/test/chapter-1/">Chapter 1</a></li>';
  globalThis.fetch = async url =>
    response(
      url,
      String(url).endsWith('/ajax/chapters/')
        ? ajax
        : String(url).endsWith('/chapter-1/')
          ? '<div class="reading-content"><story-layer><div class="nhv-reader-promo">Advertisement</div><p>Readable story.</p><span style="opacity: 0; position: fixed;">Hidden decoy</span><img src="https://cenele.com/illustration.png"></story-layer></div>'
          : details,
    );
  const riwyat = await plugin('Riwyat[madara].ts');
  const parsed = await riwyat.parseNovel('cont/test/');
  assert.equal(parsed.name, 'Fixture novel');
  assert.equal(parsed.cover, 'https://cenele.com/cover.jpg');
  assert.equal(parsed.summary, 'Fixture summary');
  assert.equal(parsed.chapters.length, 2);
  assert.match(parsed.chapters[0].path, /chapter-1/);
  ajax = '<html><h1>404</h1></html>';
  assert.equal((await riwyat.parseNovel('cont/test/')).chapters.length, 1);
  const body = load(await riwyat.parseChapter('cont/test/chapter-1/'));
  assert.match(body.text(), /Readable story/);
  assert(!body.text().includes('Hidden decoy'));
  assert(!body.text().includes('Advertisement'));
  assert.equal(body('img').length, 1);
  console.log(
    'PASS: Riwyat metadata, duplicate chapters, invalid AJAX fallback and readable content cleanup',
  );
} finally {
  globalThis.fetch = originalFetch;
}
