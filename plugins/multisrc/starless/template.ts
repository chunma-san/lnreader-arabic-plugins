import { load, CheerioAPI, Cheerio } from 'cheerio';
import { AnyNode } from 'domhandler';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import { defaultCover } from '@libs/defaultCover';
import { Filters } from '@libs/filterInputs';

type StarlessMetadata = {
  id: string;
  sourceName: string;
  sourceSite: string;
  version: string;
  icon: string;
  filters?: Filters;
};

const CHAPTERS_PER_PAGE = 50;

type Volume = { id: string; pages: number; order: number };
type ChapterIndex = {
  url: string;
  nonce: string;
  series: string;
  volumes: Volume[];
};

export class StarlessPlugin implements Plugin.PagePlugin {
  id: string;
  name: string;
  site: string;
  version: string;
  icon: string;
  filters?: Filters;
  private indexes = new Map<string, ChapterIndex>();
  imageRequestInit: Plugin.ImageRequestInit = {
    headers: { Referer: 'https://kolnovel.com/' },
  };

  constructor(source: StarlessMetadata) {
    this.id = source.id;
    this.name = source.sourceName;
    this.site = source.sourceSite;
    this.version = source.version;
    this.icon = source.icon;
    this.filters = source.filters;
  }

  resolveUrl(path: string): string {
    const url = new URL(path, this.site);
    if (!['kolnovel.com', 'free.kolnovel.com'].includes(url.hostname)) {
      throw new Error('Unexpected source URL');
    }
    return this.site.replace(/\/$/, '') + url.pathname + url.search;
  }

  private relativePath(url: string): string {
    const resolved = new URL(this.resolveUrl(url));
    return resolved.pathname + resolved.search;
  }

  private async page(url: string): Promise<CheerioAPI> {
    const response = await fetchApi(url);
    if (!response.ok)
      throw new Error(`Could not reach site (${response.status})`);
    return load(await response.text());
  }

  private cover(image: Cheerio<AnyNode>, width: number): string {
    const candidates = (image.attr('data-srcset') || image.attr('srcset') || '')
      .split(',')
      .map(candidate => candidate.trim().match(/^(.+)\s+(\d+)w$/))
      .filter((candidate): candidate is RegExpMatchArray => candidate !== null)
      .map(candidate => ({ url: candidate[1], width: Number(candidate[2]) }))
      .sort((a, b) => a.width - b.width);
    const thumbnail =
      candidates.find(candidate => candidate.width >= width) ||
      candidates[candidates.length - 1];
    const sources = [
      thumbnail?.url,
      image.attr('data-lazy-src'),
      image.attr('data-src'),
      image.attr('src'),
    ];
    for (const source of sources) {
      if (!source || source.startsWith('data:')) continue;
      try {
        const url = new URL(source, this.site);
        if (url.protocol === 'https:' || url.protocol === 'http:')
          return url.href;
      } catch {
        continue;
      }
    }
    return defaultCover;
  }

  private novels($: CheerioAPI): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];
    const paths = new Set<string>();
    $('article').each((_, element) => {
      const row = $(element);
      const link = row
        .find('h3 a[href*="/series/"], h2 a[href*="/series/"]')
        .first();
      const href = link.attr('href');
      const name = link.text().trim();
      if (!href || !name) return;
      const path = this.relativePath(href);
      if (paths.has(path)) return;
      paths.add(path);
      const image = row.find('img').first();
      novels.push({
        name,
        path,
        cover: this.cover(image, 96),
      });
    });
    return novels;
  }

  async popularNovels(
    page: number,
    options: Plugin.PopularNovelsOptions,
  ): Promise<Plugin.NovelItem[]> {
    const query: string[] = [];
    for (const [key, filter] of Object.entries(options.filters || {})) {
      if (options.showLatestNovels && key === 'order') continue;
      const values = Array.isArray(filter.value)
        ? filter.value
        : [filter.value];
      for (const value of values) {
        if (value)
          query.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
          );
      }
    }
    if (options.showLatestNovels) query.push('order=latest');
    const order = query.length ? '&' + query.join('&') : '';
    return this.novels(
      await this.page(`${this.site}series/?paged=${page}${order}`),
    );
  }

  async searchNovels(term: string, page: number): Promise<Plugin.NovelItem[]> {
    return this.novels(
      await this.page(
        `${this.site}?s=${encodeURIComponent(term)}&post_type=series&paged=${page}`,
      ),
    );
  }

  private async volumePage(
    index: ChapterIndex,
    volume: string,
    page: number,
  ): Promise<{ html: string; pages: number }> {
    const url = `${index.url}?action=kol_series_volume_chapters&nonce=${encodeURIComponent(index.nonce)}&series_id=${encodeURIComponent(index.series)}&volume=${encodeURIComponent(volume)}&page=${page}&anchor_id=0`;
    const response = await fetchApi(url);
    if (!response.ok)
      throw new Error(`Could not load chapters (${response.status})`);
    const result = await response.json();
    if (!result.success || typeof result.data?.html !== 'string') {
      throw new Error('Could not load the chapter index. Refresh the novel.');
    }
    return {
      html: result.data.html,
      pages: Math.max(1, Number(result.data.pages) || 1),
    };
  }

  private chapterIndex($: CheerioAPI): ChapterIndex {
    const root = $('[data-kol-chapter-index]').first();
    const index: ChapterIndex = {
      url: root.attr('data-kol-volume-url') || '',
      nonce: root.attr('data-kol-volume-nonce') || '',
      series: root.attr('data-kol-series-id') || '',
      volumes: [],
    };
    if (!index.url || !index.nonce || !index.series) {
      throw new Error('Could not find the chapter index');
    }
    index.url = this.resolveUrl(index.url);
    root.find('[data-kol-chapter-volume]').each((position, element) => {
      const volume = $(element);
      const count = volume
        .find('.kol-series-editorial__volume-count')
        .first()
        .text()
        .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632))
        .replace(/[^0-9]/g, '');
      const titleNumber = volume
        .find('.kol-series-editorial__volume-title')
        .text()
        .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632))
        .match(/\d+/);
      index.volumes.push({
        id: volume.attr('data-kol-chapter-volume') || '',
        pages: Math.max(1, Math.ceil(Number(count) / CHAPTERS_PER_PAGE)),
        order: titleNumber ? Number(titleNumber[0]) : position,
      });
    });
    index.volumes.sort((a, b) => a.order - b.order);
    return index;
  }

  async parseNovel(
    novelPath: string,
  ): Promise<Plugin.SourceNovel & { totalPages: number }> {
    const $ = await this.page(this.resolveUrl(novelPath));
    const name = $('h1.kol-series-editorial__title').text().trim();
    if (!name) throw new Error('Could not find the novel title');
    const index = this.chapterIndex($);
    if (this.indexes.size >= 5) this.indexes.clear();
    this.indexes.set(novelPath, index);
    const summary = $(
      '.kol-series-editorial__synopsis-dialog-body [itemprop="description"]',
    ).first();
    summary.find('script, style, .shola-widget, .code-block').remove();
    const status = $('.kol-series-editorial__status').first().text();
    return {
      name,
      path: novelPath,
      cover: this.cover(
        $(
          '.kol-series-editorial__cover img, img.wp-post-image, [itemprop="image"] img',
        ).first(),
        224,
      ),
      summary: summary.text().trim(),
      author: $('a[href*="/writer/"], a[href*="/author/"]')
        .first()
        .text()
        .trim(),
      genres: $('.kol-series-editorial__genres a')
        .map((_, element) => $(element).text())
        .get()
        .join(', '),
      status: status.includes('مستمرة')
        ? NovelStatus.Ongoing
        : status.includes('مكتملة')
          ? NovelStatus.Completed
          : NovelStatus.Unknown,
      totalPages: index.volumes.reduce(
        (total, volume) => total + volume.pages,
        0,
      ),
      chapters: [],
    };
  }

  async parsePage(novelPath: string, page: string): Promise<Plugin.SourcePage> {
    let index = this.indexes.get(novelPath);
    if (!index) {
      index = this.chapterIndex(await this.page(this.resolveUrl(novelPath)));
      this.indexes.set(novelPath, index);
    }
    let remaining = Number(page);
    if (!Number.isInteger(remaining) || remaining < 1) return { chapters: [] };
    for (const volume of index.volumes) {
      if (remaining > volume.pages) {
        remaining -= volume.pages;
        continue;
      }
      const actualPage = volume.pages - remaining + 1;
      const result = await this.volumePage(index, volume.id, actualPage);
      if (result.pages !== volume.pages) {
        throw new Error('The chapter index changed. Refresh the novel.');
      }
      const html = result.html;
      const $ = load(html);
      const chapters: Plugin.ChapterItem[] = [];
      const paths = new Set<string>();
      $('[data-kol-chapter-row]').each((_, element) => {
        const row = $(element);
        const href = row.find('a[href]').first().attr('href');
        if (!href) return;
        const path = this.relativePath(href);
        if (paths.has(path)) return;
        paths.add(path);
        const number =
          row
            .find('[data-kol-chapter-number]')
            .attr('data-kol-chapter-number') || '';
        const title = row.find('[data-kol-chapter-title]').text().trim();
        chapters.push({
          name: `${number} - ${title}`,
          path,
          chapterNumber: Number(number) || undefined,
          releaseTime: row.find('time').attr('datetime'),
        });
      });
      return { chapters: chapters.reverse() };
    }
    return { chapters: [] };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const $ = await this.page(this.resolveUrl(chapterPath));
    const content = $('.epcontent').first();
    if (!content.length)
      throw new Error('Chapter content is unavailable. Check it in WebView.');
    $('article > style')
      .text()
      .match(/\.\w+(?=\s*[,{])/g)
      ?.forEach(selector => content.find(`p${selector}`).remove());
    content
      .find(
        'script, style, noscript, iframe, object, embed, input, button, .code-block, [hidden], [role="presentation"]',
      )
      .remove();
    content.find('img').each((_, element) => {
      const image = $(element);
      const source =
        image.attr('data-src') ||
        image.attr('data-lazy-src') ||
        image.attr('src');
      if (source) image.attr('src', new URL(source, this.site).href);
    });
    content.find('*').each((_, element) => {
      for (const attribute of Object.keys(element.attribs)) {
        if (
          /^on/i.test(attribute) ||
          /^(?:javascript|vbscript):/i.test(
            element.attribs[attribute].replace(/\s/g, ''),
          )
        ) {
          $(element).removeAttr(attribute);
        }
      }
    });
    return content.html() || '';
  }
}
