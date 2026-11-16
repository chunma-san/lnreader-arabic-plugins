export const CLOUDFLARE_HEADER_HINTS = [
  'cf-ray',
  'cf-cache-status',
  'cf-request-id',
];

export function isNetworkOrBlockError(error) {
  const code = error?.code || error?.cause?.code;
  const message = String(error?.message || '');
  if (
    /^Captcha error, please open in webview(?: \(or the website has changed url\))?$/.test(
      message,
    )
  ) {
    return { inconclusive: true, reason: message };
  }
  if (['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(code)) {
    return { inconclusive: true, reason: `Network error (${code})` };
  }
  if (/timed? ?out/i.test(message)) {
    return { inconclusive: true, reason: 'Timeout' };
  }
  // Only 403/503 indicate a block — a cf-ray/cf-cache-status header alone
  // just means the site is fronted by Cloudflare's CDN (true for a huge
  // share of the web) and says nothing about whether we were blocked.
  const status = error?.response?.status ?? error?.status;
  if (status === 429) {
    return { inconclusive: true, reason: 'HTTP 429 (rate limited)' };
  }
  if (status === 403 || status === 503) {
    const headers = error?.response?.headers;
    const headerKeys = headers
      ? Object.keys(
          typeof headers.entries === 'function'
            ? Object.fromEntries(headers.entries())
            : headers,
        ).map(k => k.toLowerCase())
      : [];
    const isCloudflare = CLOUDFLARE_HEADER_HINTS.some(h =>
      headerKeys.includes(h),
    );
    return {
      inconclusive: true,
      reason: `HTTP ${status}${isCloudflare ? ' (Cloudflare)' : ' (likely anti-bot block)'}`,
    };
  }
  return { inconclusive: false };
}
