import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import languages from '../languages.js';

const root = '.arabic-release';
const manifest = JSON.parse(fs.readFileSync(`${root}/.dist/plugins.json`));
const minified = JSON.parse(fs.readFileSync(`${root}/.dist/plugins.min.json`));
assert.deepEqual(manifest, minified);
assert(manifest.length > 0);
assert.equal(new Set(manifest.map(plugin => plugin.id)).size, manifest.length);
const info = JSON.parse(fs.readFileSync(`${root}/build-info.json`));
const base = `https://raw.githubusercontent.com/${info.repository}/${info.branch}/`;
for (const plugin of manifest) {
  assert.equal(plugin.lang, languages.Arabic);
  assert(/^\d+\.\d+\.\d+$/.test(plugin.version));
  for (const key of ['url', 'iconUrl', 'customJS', 'customCSS']) {
    if (!plugin[key]) continue;
    assert(plugin[key].startsWith(base));
    const relative = decodeURIComponent(plugin[key].slice(base.length));
    assert(!relative.split('/').includes('..'));
    assert(fs.statSync(path.join(root, relative)).isFile());
    if (key === 'url') {
      assert(relative.startsWith('.js/src/plugins/arabic/'));
      new vm.Script(fs.readFileSync(path.join(root, relative), 'utf8'));
    }
  }
}
assert.deepEqual(fs.readdirSync(`${root}/.js/src/plugins`), ['arabic']);
assert.equal(
  fs.readdirSync(`${root}/.js/src/plugins/arabic`).length,
  manifest.length,
);
console.log(
  `Validated ${manifest.length} Arabic plugins and their public assets`,
);
