const TRACKING_PARAMS = [
  /^utm_/i,
  /^gh_src$/i,
  /^source$/i,
  /^src$/i,
  /^ref$/i,
  /^refid$/i,
  /^trk/i,
  /^tracking/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^mc_[ce]id$/i,
  /^lipi$/i,
  /^ebp$/i,
  /^from$/i,
];

/**
 * Normalises a URL into a key identifying "this page": drops the hash and tracking
 * parameters, sorts remaining parameters and removes trailing slashes.
 */
export function pageKeyFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const params = [...url.searchParams.entries()]
      .filter(([key]) => !TRACKING_PARAMS.some((re) => re.test(key)))
      .sort(([a], [b]) => a.localeCompare(b));
    const search = params.length ? '?' + params.map(([k, v]) => `${k}=${v}`).join('&') : '';
    const path = url.pathname.replace(/\/+$/, '') || '/';
    return `${url.protocol}//${url.host.toLowerCase()}${path}${search}`;
  } catch {
    return rawUrl;
  }
}

export function hostFromUrl(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}
