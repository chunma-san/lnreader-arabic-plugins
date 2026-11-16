import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadNovelSample } from './novel-sample.js';

const candidates = ['empty', 'empty2', 'readable', 'unused'].map(path => ({
  path,
}));
const run = promise => promise;

test('samples another novel when the first listings have no published chapters', async () => {
  const paths = [];
  const plugin = {
    async parseNovel(path) {
      return { name: path, chapters: [] };
    },
    async parsePage(path) {
      paths.push(path);
      return { chapters: path === 'readable' ? [{ path: '/chapter' }] : [] };
    },
  };
  const result = await loadNovelSample(plugin, candidates, run);
  assert.equal(result.emptyCount, 2);
  assert.equal(result.novel.chapters[0].path, '/chapter');
  assert.deepEqual(paths, ['empty', 'empty2', 'readable']);
});

test('fails after three empty novels', async () => {
  await assert.rejects(
    loadNovelSample(
      {
        async parseNovel(path) {
          return { name: path, chapters: [] };
        },
      },
      candidates,
      run,
    ),
    /No chapters returned from 3 sampled novels/,
  );
});

test('loads page one when paginated metadata omits chapters', async () => {
  const result = await loadNovelSample(
    {
      async parseNovel() {
        return { name: 'Metadata only' };
      },
      async parsePage(path, page) {
        assert.equal(path, 'empty');
        assert.equal(page, '1');
        return { chapters: [{ path: '/first' }] };
      },
    },
    candidates,
    run,
  );
  assert.equal(result.novel.chapters[0].path, '/first');
});

test('does not hide parser errors or malformed results by retrying', async () => {
  for (const value of [null, { name: 'broken' }]) {
    await assert.rejects(
      loadNovelSample(
        {
          async parseNovel() {
            return value;
          },
        },
        candidates,
        run,
      ),
      /Missing/,
    );
  }
  await assert.rejects(
    loadNovelSample(
      {
        async parseNovel() {
          throw new Error('HTTP 403');
        },
      },
      candidates,
      run,
    ),
    /HTTP 403/,
  );
});
