import { load as loadCheerio } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { defaultCover } from '@libs/defaultCover';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import { Filters, FilterTypes } from '@libs/filterInputs';

type ChapterJSON = {
  id: number;
  position: number;
  number: string;
  label: string;
  title: string;
  url: string;
  content_api: string;
  date_iso: string;
};

type ChaptersIndex = {
  novel_id: number;
  total: number;
  chapters: ChapterJSON[];
};

type ChapterContentResponse = {
  schema: number;
  data: {
    content_html: string;
    display_title: string;
    navigation: { next_url: string; previous_url: string };
  };
};

class WorReaderPlugin implements Plugin.PluginBase {
  id: string;
  name: string;
  version: string;
  icon: string;
  site = 'https://galaxynovels.com/';
  constructor(
    private source: {
      id: string;
      sourceName: string;
      version: string;
      options: { lang: string; legacyPaths?: boolean; legacyPostIds?: boolean };
    },
  ) {
    this.id = source.id;
    this.name =
      source.id === 'markazriwayat' ? 'مركز الروايات' : 'Galaxy Novels';
    this.version = source.version;
    this.icon = `src/ar/${source.id}/icon.png`;
  }
  private toPath(value: string): string {
    const url = new URL(value, this.site);
    const path = url.pathname;
    return (
      (this.source.options.legacyPaths ? path.replace(/^\/|\/$/g, '') : path) +
      url.search
    );
  }

  filters = {
    sort: {
      label: 'Sort By',
      value: 'popular',
      options: [
        { label: 'Most Popular', value: 'popular' },
        { label: 'Newest', value: 'new' },
        { label: 'Recently Updated', value: 'recent' },
      ],
      type: FilterTypes.Picker,
    },
    period: {
      label: 'Period',
      value: 'month',
      options: [
        { label: 'Month', value: 'month' },
        { label: 'Week', value: 'week' },
        { label: 'All Time', value: 'all' },
      ],
      type: FilterTypes.Picker,
    },
  } satisfies Filters;

  private baseUrl = 'https://galaxynovels.com';

  private async fetchHtml(url: string): Promise<string> {
    const res = await fetchApi(url);
    if (!res.ok) {
      throw Object.assign(new Error(`Could not reach site (${res.status})`), {
        status: res.status,
      });
    }
    return res.text();
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const res = await fetchApi(url);
    if (!res.ok) {
      throw Object.assign(new Error(`Could not reach site (${res.status})`), {
        status: res.status,
      });
    }
    return res.json() as Promise<T>;
  }

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels,
      filters,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const sort = showLatestNovels ? 'new' : filters.sort.value;
    const period = filters.period.value;

    let url: string;
    if (sort === 'new') {
      url = `${this.baseUrl}/novels/?sort=new&page=${pageNo}`;
    } else if (sort === 'recent') {
      url = `${this.baseUrl}/recent/?page=${pageNo}`;
    } else {
      url = `${this.baseUrl}/novels/?sort=popular&period=${period}&page=${pageNo}`;
    }

    const html = await this.fetchHtml(url);
    const $ = loadCheerio(html);

    const novels: Plugin.NovelItem[] = [];
    $('article.wor-novel-card').each((_, el) => {
      const $el = $(el);
      const coverLink = $el.find('a.wor-novel-card__cover');
      const href = coverLink.attr('href');
      const img = $el.find('img.wor-cover-img');
      const cover = img.attr('data-src') || img.attr('src') || defaultCover;
      const title = $el.find('h3 a').text().trim();

      if (!href || !title) return;

      const path = this.toPath(href);

      novels.push({
        name: title,
        path,
        cover,
      });
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const originalPath = novelPath;
    novelPath = this.toPath(novelPath);
    const resolved = new URL(novelPath, this.site);
    if (resolved.origin !== new URL(this.site).origin)
      throw new Error('Novel URL is outside the source origin');
    const url = resolved.href;
    const html = await this.fetchHtml(url);
    const $ = loadCheerio(html);

    const title = $('h1').first().text().trim();
    const img = $('img.wor-cover-img').first();
    const cover = img.attr('data-src') || img.attr('src') || defaultCover;
    const author = $('p.wor-single-hero__meta-text span').text().trim();
    const summary = $('.wor-single-summary__text').text().trim();

    const genres: string[] = [];
    $('a.wor-tag-pill').each((_, el) => {
      genres.push($(el).text().trim());
    });

    const statusText = $('span.wor-cover-status').text().trim();
    const statusMap: Record<string, string> = {
      'مستمرة': NovelStatus.Ongoing,
      'مكتملة': NovelStatus.Completed,
      'متوقفة': NovelStatus.OnHiatus,
    };
    const status = statusMap[statusText] || NovelStatus.Unknown;

    const chaptersContainer = $('[data-wor-chapters-container]');
    let chaptersIndexUrl = chaptersContainer.attr('data-index-url');
    const chaptersManifestUrl = chaptersContainer.attr('data-manifest-url');

    let chapters: Plugin.ChapterItem[] = [];

    if (!chaptersIndexUrl && chaptersManifestUrl) {
      const manifest = await this.fetchJson<{ pack_url?: string }>(
        new URL(chaptersManifestUrl, this.site).href,
      );
      if (!manifest.pack_url)
        throw new Error('Chapter manifest has no pack URL');
      chaptersIndexUrl = manifest.pack_url;
    }

    if (chaptersIndexUrl) {
      const index = await this.fetchJson<ChaptersIndex>(
        new URL(chaptersIndexUrl, this.site).href,
      );
      if (
        !Array.isArray(index.chapters) ||
        index.chapters.length !== index.total
      ) {
        throw new Error('Incomplete chapter index');
      }
      chapters = index.chapters.map(ch => ({
        name: ch.label + (ch.title ? `: ${ch.title}` : ''),
        path: ch.url
          ? new URL(ch.url, this.site).pathname.replace(
              this.source.options.legacyPaths ? /^\// : /$^/,
              '',
            )
          : `${new URL(novelPath, this.site).pathname.replace(this.source.options.legacyPaths ? /^\// : /$^/, '').replace(/\/?$/, '/')}chapter-${ch.id}/${this.source.options.legacyPostIds ? '' : `?wor_post_id=${ch.id}`}`,
        chapterNumber: ch.position,
        releaseTime: ch.date_iso?.split('T')[0] || '',
      }));
    }

    if (chapters.length === 0) {
      $('article.wor-novel-chapter-item').each((_, el) => {
        const $el = $(el);
        const chapterLink =
          $el.find('h3 a').attr('href') ||
          $el.find('a.wor-novel-chapter-item__num').attr('href');
        const chapterName =
          $el.find('h3 a').text().trim() ||
          $el.find('a.wor-novel-chapter-item__num').text().trim();
        const timeEl = $el.find('time');
        const releaseTime = timeEl.attr('datetime')?.split('T')[0] || '';

        if (!chapterLink) return;

        const path = new URL(chapterLink, this.site).pathname.replace(
          this.source.options.legacyPaths ? /^\// : /$^/,
          '',
        );
        const numMatch = path.match(/chapter-(\d+)/);
        const chapterNumber = numMatch ? parseInt(numMatch[1]) : 0;

        chapters.push({
          name: chapterName,
          path,
          chapterNumber,
          releaseTime,
        });
      });
    }

    return {
      path: originalPath,
      name: title,
      cover,
      author: author || 'Unknown',
      genres: genres.join(', '),
      summary,
      status,
      chapters,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    // Only legacy `chapter-<id>/` paths carry the post id; real URLs are `chapter-<number>/<slug>/`
    const parsedPath = new URL(chapterPath, this.site);
    if (parsedPath.origin !== new URL(this.site).origin)
      throw new Error('Chapter URL is outside the source origin');
    const markedId = parsedPath.searchParams.get('wor_post_id');
    const legacyId = this.source.options.legacyPostIds
      ? parsedPath.pathname.match(/chapter-(\d+)\/?$/)?.[1]
      : undefined;
    const chapterId = markedId && /^\d+$/.test(markedId) ? markedId : legacyId;

    if (chapterId) {
      const apiUrl = `${this.baseUrl}/wp-json/wor-reader-app/v1/chapters/${chapterId}`;
      try {
        const response = await this.fetchJson<ChapterContentResponse>(apiUrl);
        if (response.data?.content_html) {
          return response.data.content_html;
        }
        if (markedId) throw new Error('Chapter API returned no content');
      } catch (error) {
        if (markedId) throw error;
      }
    }

    const url = parsedPath.href;
    const html = await this.fetchHtml(url);
    const $ = loadCheerio(html);
    $('[data-wor-decoy], [hidden]').remove();
    const content = $(
      '.wor-reader-text-surface, article.wor-chapter-content, .wor-chapter-text, .entry-content',
    )
      .first()
      .html();
    return content || '<p>Content not available.</p>';
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const manifestUrl =
      'https://galaxynovels.com/wp-content/uploads/wor-reader-cache/search/manifest.json';
    const manifest = await this.fetchJson<{
      index: string;
    }>(manifestUrl);

    const searchIndex = await this.fetchJson<{
      items: {
        t: string;
        u: string;
        c?: string;
        s: string;
      }[];
    }>(manifest.index);

    const term = searchTerm.toLowerCase();
    const filtered = searchIndex.items.filter(
      n => n.t.toLowerCase().includes(term) || n.s.toLowerCase().includes(term),
    );

    const limit = 20;
    const offset = (pageNo - 1) * limit;

    return filtered.slice(offset, offset + limit).map(novel => ({
      name: novel.t,
      path: this.toPath(novel.u),
      cover: novel.c ? new URL(novel.c, this.site).href : defaultCover,
    }));
  }
}
