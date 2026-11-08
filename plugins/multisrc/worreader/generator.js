import list from './sources.json' with { type: 'json' };
import { readFileSync } from 'node:fs';
const template = readFileSync(
  new URL('./template.ts', import.meta.url),
  'utf8',
);
export function generateAll() {
  return list.map(source => ({
    lang: source.options.lang,
    filename: source.sourceName,
    pluginScript: `${template}\nexport default new WorReaderPlugin(${JSON.stringify(source)});\n`,
  }));
}
