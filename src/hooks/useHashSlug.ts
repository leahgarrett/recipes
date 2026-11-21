import { useCallback, useEffect, useState } from 'react';
import { recipeHref, slugFromHash } from '../utils/recipeRoute';

/** The recipe slug in the address bar, kept in sync with Back/Forward and pasted links. */
export function useHashSlug(): [string | null, (slug: string) => void] {
  const [slug, setSlug] = useState(() => slugFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setSlug(slugFromHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Assigning location.hash adds a history entry, so Back returns to the previous recipe.
  const navigate = useCallback((next: string) => {
    window.location.hash = recipeHref(next);
    setSlug(next);
  }, []);

  return [slug, navigate];
}
