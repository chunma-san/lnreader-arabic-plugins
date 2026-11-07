import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { NovelStatus } from '@libs/novelStatus';
import { Filters, FilterTypes } from '@libs/filterInputs';

type SeanovelNovel = {
  slug: string;
  source_id: number;
  title_ar: string;
  title_original: string;
  origin: string;
  author: string;
  status: string;
  genres: string[];
  chapters_count: number;
  last_updated: string;
  description: string;
  rating: number;
  has_volumes: boolean;
  chapters: { id: number; title: string; date: string }[];
  cover_version?: number;
};

type SeanovelNovelListItem = {
  slug: string;
  title_ar: string;
  title_original: string;
  author: string;
  status: string;
  genres: string[];
  chapters_count: number;
  description: string;
};

/**
 * Pull the `initialParagraphs` array out of a Next.js RSC payload.
 *
 * The array is sliced out by scanning for its closing bracket, but a plain
 * depth counter breaks on the first `[` or `]` that appears *inside* a
 * paragraph — translated chapters quote things like "انظر [ملاحظة]" often
 * enough that ~4% of chapters came back as a truncated, unparseable slice and
 * the reader showed "Content not available". So the scan has to know when it
 * is inside a JSON string literal.
 */
function extractInitialParagraphs(
  payload: string,
  decodeRecord = true,
): string[] {
  if (decodeRecord) {
    const inspectRecord = (value: unknown): string[] => {
      const pending = [value];
      while (pending.length) {
        const current = pending.pop();
        if (typeof current === 'string') {
          const paragraphs = extractInitialParagraphs(current, false);
          if (paragraphs.length) return paragraphs;
          try {
            pending.push(JSON.parse(current));
          } catch {
            continue;
          }
        } else if (current && typeof current === 'object') {
          if (
            'initialParagraphs' in current &&
            Array.isArray(current.initialParagraphs)
          ) {
            const paragraphs = current.initialParagraphs.filter(
              (value): value is string => typeof value === 'string',
            );
            if (paragraphs.some(value => value.trim())) return paragraphs;
          }
          pending.push(...Object.values(current));
        }
      }
      return [];
    };
    let offset = 0;
    while (offset < payload.length) {
      const header = /^[\da-f]+:/i.exec(payload.slice(offset));
      if (header) offset += header[0].length;
      const textHeader = /^T([\da-f]+),/i.exec(payload.slice(offset));
      if (header && textHeader) {
        offset += textHeader[0].length;
        const textStart = offset;
        const byteLength = parseInt(textHeader[1], 16);
        let bytes = 0;
        while (offset < payload.length && bytes < byteLength) {
          const code = payload.charCodeAt(offset++);
          if (code < 0x80) bytes++;
          else if (code < 0x800) bytes += 2;
          else if (
            code >= 0xd800 &&
            code <= 0xdbff &&
            payload.charCodeAt(offset) >= 0xdc00 &&
            payload.charCodeAt(offset) <= 0xdfff
          ) {
            bytes += 4;
            offset++;
          } else bytes += 3;
        }
        const paragraphs = inspectRecord(payload.slice(textStart, offset));
        if (paragraphs.length) return paragraphs;
        continue;
      }
      const end = payload.indexOf('\n', offset);
      const record = payload.slice(offset, end < 0 ? payload.length : end);
      offset = end < 0 ? payload.length : end + 1;
      try {
        const decoded: unknown = JSON.parse(record);
        const paragraphs = inspectRecord(decoded);
        if (paragraphs.length) return paragraphs;
      } catch {
        continue;
      }
    }
  }
  const keyIndex = payload.indexOf('"initialParagraphs"');
  if (keyIndex < 0) return [];
  const start = payload.indexOf('[', keyIndex);
  if (start < 0) return [];

  let depth = 0;
  let inString = false;
  for (let i = start; i < payload.length; i++) {
    const char = payload[i];
    if (inString) {
      if (char === '\\') {
        i++; // the next character is escaped, whatever it is
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === '[' || char === '{') {
      depth++;
    } else if (char === ']' || char === '}') {
      depth--;
      if (depth === 0) {
        try {
          const parsed: unknown = JSON.parse(payload.substring(start, i + 1));
          return Array.isArray(parsed)
            ? parsed.filter(
                (value): value is string =>
                  typeof value === 'string' && value.trim().length > 0,
              )
            : [];
        } catch {
          return [];
        }
      }
    }
  }

  return [];
}

class Seanovel implements Plugin.PluginBase {
  id = 'seanovel';
  name = 'Seanovel';
  version = '1.2.1';
  icon = 'src/ar/seanovel/icon.png';
  site = 'https://seanovel.org/';

  filters = {
    sort: {
      label: 'Sort By',
      value: 'views',
      options: [
        { label: 'Most Popular', value: 'views' },
        { label: 'Latest', value: 'latest' },
        { label: 'Rating', value: 'rating' },
      ],
      type: FilterTypes.Picker,
    },
    origin: {
      label: 'Origin',
      value: '',
      options: [
        { label: 'All', value: '' },
        { label: 'English', value: 'english' },
        { label: 'Chinese', value: 'chinese' },
        { label: 'Korean', value: 'korean' },
        { label: 'Japanese', value: 'japanese' },
      ],
      type: FilterTypes.Picker,
    },
  } satisfies Filters;

  private baseUrl = 'https://seanovel.org';

  private async fetchJson<T>(url: string): Promise<T> {
    const res = await fetchApi(url);
    if (!res.ok) {
      throw new Error(`Could not reach site (${res.status})`);
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
    const sort = showLatestNovels ? 'latest' : filters.sort.value;
    const limit = 50;
    const offset = (pageNo - 1) * limit;

    let url = `${this.baseUrl}/api/novels?sort=${sort}&page=${pageNo}&limit=${limit}&offset=${offset}`;
    if (filters.origin.value) {
      url += `&origin=${filters.origin.value}`;
    }

    const novels = await this.fetchJson<SeanovelNovelListItem[]>(url);

    return novels.map(novel => ({
      name: novel.title_original || novel.title_ar,
      path: `/novels/${novel.slug}`,
      cover: `${this.baseUrl}/api/novel/${novel.slug}/cover?type=webp`,
    }));
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const slug = novelPath.replace('/novels/', '').replace(/\/$/, '');
    const novel = await this.fetchJson<SeanovelNovel>(
      `${this.baseUrl}/api/novel/${slug}`,
    );

    const statusMap: Record<string, string> = {
      ongoing: NovelStatus.Ongoing,
      completed: NovelStatus.Completed,
      hiatus: NovelStatus.OnHiatus,
      dropped: NovelStatus.Cancelled,
      cancelled: NovelStatus.Cancelled,
    };

    return {
      path: novelPath,
      name: novel.title_original || novel.title_ar,
      cover: `${this.baseUrl}/api/novel/${slug}/cover?type=webp`,
      author: novel.author || 'Unknown',
      genres: novel.genres?.join(', ') || '',
      summary: novel.description || '',
      status: statusMap[novel.status?.toLowerCase()] || NovelStatus.Unknown,
      chapters: (novel.chapters || [])
        .sort((a, b) => a.id - b.id)
        .map((ch, index) => ({
          name: ch.title || `Chapter ${ch.id}`,
          path: `/novels/${slug}/chapters/${ch.id}`,
          chapterNumber: index + 1,
          releaseTime: ch.date?.split('T')[0] || '',
        })),
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = `${this.baseUrl}${chapterPath}`;
    const res = await fetchApi(url);
    const html = await res.text();

    const allChunks: string[] = [];
    const regex =
      /self\.__next_f\.push\(\s*\[\s*\d+\s*,\s*("(?:[^"\\]|\\.)*")\s*\]/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      try {
        allChunks.push(JSON.parse(match[1]));
      } catch {
        // skip unparseable chunks
      }
    }

    if (allChunks.length > 0) {
      const paragraphs = extractInitialParagraphs(allChunks.join(''));
      if (paragraphs.length > 0) {
        return paragraphs
          .filter(p => typeof p === 'string' && p.trim())
          .map(p => `<p>${p.trim()}</p>`)
          .join('\n');
      }
    }

    return '<p>Content not available. Open in webview to read.</p>';
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const limit = 50;
    const offset = (pageNo - 1) * limit;
    const allNovels = await this.fetchJson<SeanovelNovelListItem[]>(
      `${this.baseUrl}/api/novels?sort=views&page=1&limit=500&offset=0`,
    );

    const term = searchTerm.toLowerCase();
    const filtered = allNovels.filter(
      n =>
        (n.title_original && n.title_original.toLowerCase().includes(term)) ||
        (n.title_ar && n.title_ar.includes(searchTerm)) ||
        (n.author && n.author.toLowerCase().includes(term)),
    );

    return filtered.slice(offset, offset + limit).map(novel => ({
      name: novel.title_original || novel.title_ar,
      path: `/novels/${novel.slug}`,
      cover: `${this.baseUrl}/api/novel/${novel.slug}/cover?type=webp`,
    }));
  }
}

export default new Seanovel();
