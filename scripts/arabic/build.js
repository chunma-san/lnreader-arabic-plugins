import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { minify } from '../terser.js';
import languages from '../languages.js';
import './generate.js';

const repository =
  process.env.GITHUB_REPOSITORY || 'chunma-san/lnreader-arabic-plugins';
if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) {
  throw new Error('Invalid repository name');
}
const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid feed version');
const branch = `plugins/v${version}`;
const base = `https://raw.githubusercontent.com/${repository}/${branch}`;
const output = '.arabic-release';
fs.rmSync('.arabic-build', { recursive: true, force: true });
fs.rmSync(output, { recursive: true, force: true });
execFileSync(
  process.execPath,
  ['node_modules/typescript/bin/tsc', '--project', 'tsconfig.arabic.json'],
  { stdio: 'inherit' },
);

const proxy = () =>
  new Proxy(
    {},
    {
      get(target, property) {
        if (property === 'get') return value => value;
        return (target[property] ??= proxy());
      },
    },
  );
const runtime = proxy();
const manifest = [];
const ids = new Set();
const sourceFiles = fs
  .readdirSync('plugins/arabic')
  .filter(file => file.endsWith('.ts') && !file.endsWith('.broken.ts'));

function copyAsset(asset) {
  const source = path.resolve('public/static', asset);
  const root = path.resolve('public/static') + path.sep;
  if (!source.startsWith(root) || !fs.statSync(source).isFile()) {
    throw new Error(`Invalid public asset: ${asset}`);
  }
  const destination = path.join(output, 'public/static', asset);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  return `${base}/public/static/${asset.split('/').map(encodeURIComponent).join('/')}`;
}

for (const sourceFile of sourceFiles) {
  const file = sourceFile.replace(/\.ts$/, '.js');
  const code = fs.readFileSync(path.join('.arabic-build/arabic', file), 'utf8');
  const instance = Function(
    'require',
    'module',
    `const exports = module.exports = {};\n${code}\nreturn exports.default;`,
  )(() => runtime, {});
  if (!instance.id || ids.has(instance.id)) {
    throw new Error(`Missing or duplicate plugin ID: ${instance.id}`);
  }
  ids.add(instance.id);
  const destination = path.join(output, '.js/src/plugins/arabic', file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, code);
  minify(destination);
  const info = {
    id: instance.id,
    name: instance.name.replace(/\[.*\]/, ''),
    site: instance.site,
    lang: languages.Arabic,
    version: instance.version,
    url: `${base}/.js/src/plugins/arabic/${encodeURIComponent(file)}`,
    iconUrl: copyAsset(instance.icon || 'siteNotAvailable.png'),
  };
  if (instance.customJS) info.customJS = copyAsset(instance.customJS);
  if (instance.customCSS) info.customCSS = copyAsset(instance.customCSS);
  manifest.push(info);
}
if (!manifest.length) throw new Error('The Arabic catalog is empty');
manifest.sort((a, b) => a.id.localeCompare(b.id));
fs.mkdirSync(path.join(output, '.dist'), { recursive: true });
fs.writeFileSync(
  path.join(output, '.dist/plugins.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
fs.writeFileSync(
  path.join(output, '.dist/plugins.min.json'),
  JSON.stringify(manifest),
);
fs.copyFileSync('LICENSE', path.join(output, 'LICENSE'));
fs.writeFileSync(
  path.join(output, 'README.md'),
  `# LNReader Arabic Plugins\n\n${manifest.length} Arabic plugins maintained by [chunma-san](https://github.com/chunma-san).\n\nSource: https://github.com/${repository}\n\nBased on LNReader/lnreader-plugins. Original authorship and MIT license preserved.\n`,
);
fs.writeFileSync(
  path.join(output, 'build-info.json'),
  JSON.stringify(
    {
      source: execFileSync('git', ['rev-parse', 'HEAD'], {
        encoding: 'utf8',
      }).trim(),
      repository,
      branch,
      plugins: manifest.map(({ id, version }) => ({ id, version })),
    },
    null,
    2,
  ) + '\n',
);
console.log(`Built ${manifest.length} Arabic plugins for ${branch}`);
