/** Lowercase, hyphen-separated, ASCII-only identifier for use in a recipe's URL. */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents left over after NFKD
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '') // "nana's" -> "nanas", not "nana-s"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'recipe';
}
