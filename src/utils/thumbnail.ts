/**
 * Utility helpers for URL formatting and thumbnail generation.
 */

export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(normalizeUrl(urlString));
    return Boolean(url.hostname && url.hostname.includes('.'));
  } catch {
    return false;
  }
}

export function getCleanDomain(urlString: string): string {
  try {
    const normalized = normalizeUrl(urlString);
    const url = new URL(normalized);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return urlString.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || urlString;
  }
}

export function generateWebsiteThumbnail(websiteUrl: string): string {
  if (!websiteUrl) return '';
  const normalized = normalizeUrl(websiteUrl);
  return `https://api.microlink.io?url=${encodeURIComponent(normalized)}&screenshot=true&meta=false&embed=screenshot.url`;
}

export function getCleanFallbackThumbnail(title: string): string {
  const safeTitle = (title || 'Projek Website').substring(0, 30);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%23f4f4f5"/><rect x="40" y="40" width="720" height="420" rx="12" fill="%23ffffff" stroke="%23e4e4e7" stroke-width="2"/><circle cx="70" cy="70" r="6" fill="%23ef4444"/><circle cx="90" cy="70" r="6" fill="%23f59e0b"/><circle cx="110" cy="70" r="6" fill="%2310b981"/><line x1="40" y1="100" x2="760" y2="100" stroke="%23f4f4f5" stroke-width="2"/><text x="400" y="270" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="%2318181b" text-anchor="middle">${encodeURIComponent(safeTitle)}</text><text x="400" y="310" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="%2371717a" text-anchor="middle">Pratonton Laman Web</text></svg>`;
}
