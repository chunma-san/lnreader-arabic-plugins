import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const target = 'plugins/arabic';
for (const file of fs.readdirSync(target)) {
  if (/\[.*\]\.ts$/.test(file)) fs.unlinkSync(path.join(target, file));
}

for (const entry of fs.readdirSync('plugins/multisrc', {
  withFileTypes: true,
})) {
  if (!entry.isDirectory() || entry.name.endsWith('.broken')) continue;
  const directory = path.join('plugins/multisrc', entry.name);
  const sourcesPath = path.join(directory, 'sources.json');
  if (!fs.existsSync(sourcesPath)) continue;
  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
  if (!sources.some(source => source.options?.lang === 'Arabic')) continue;
  const { generateAll } = await import(
    pathToFileURL(path.resolve(directory, 'generator.js')).href
  );
  for (const source of generateAll()) {
    if (source.lang !== 'Arabic') continue;
    const name = source.filename.replace(/[\s-.]+/g, '');
    if (!/^\w+$/.test(name)) throw new Error('Invalid generated plugin name');
    fs.writeFileSync(
      path.join(target, `${name}[${entry.name}].ts`),
      source.pluginScript,
    );
  }
}
