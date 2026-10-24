import sources from './sources.json' with { type: 'json' };
import { readFileSync } from 'node:fs';

export function generateAll() {
  const template = readFileSync(
    new URL('./template.ts', import.meta.url),
    'utf8',
  );
  const { filters } = JSON.parse(
    readFileSync(
      new URL('../lightnovelwp/filters/kolnovel.json', import.meta.url),
      'utf8',
    ),
  );
  return sources.map(source => ({
    lang: source.options.lang,
    filename: source.sourceName.replace(/[^\w]/g, ''),
    pluginScript: `${template}\nexport default new StarlessPlugin(${JSON.stringify({ ...source, filters })});\n`,
  }));
}
