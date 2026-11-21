// Recipe addresses are hash-based (#/fluffy-pancakes) because GitHub Pages serves a 404 for
// any path it has no file for, so /recipes/fluffy-pancakes would break on refresh.

export function recipeHref(slug: string): string {
  return `#/${slug}`;
}

export function slugFromHash(hash: string): string | null {
  const raw = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // A malformed escape (e.g. a link truncated mid-%XX): keep the raw text rather than crash.
  }
  return decoded.toLowerCase();
}
