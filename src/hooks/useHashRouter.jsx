import { useState, useEffect } from 'react';

/**
 * parse a hash like:
 *   "#inspectr/42/details?view=raw&highlight=true"
 * into { slug, operationId, subTab, params }
 */
export function parseHash() {
  const raw = window.location.hash.slice(1); // drop "#"
  const [path, qs] = raw.split('?'); // "inspectr/42/details", "view=raw..."
  const decodePart = (value) => {
    if (value == null) return value;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  const [slug, operationId, ...subTabParts] = path.split('/');
  const subTab = subTabParts.length ? subTabParts.join('/') : undefined;
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  return {
    slug: decodePart(slug),
    operationId: decodePart(operationId),
    subTab: decodePart(subTab),
    params
  };
}

/**
 * A hook that:
 *  - reads and parses the hash on mount
 *  - listens for back/forward (hashchange)
 *  - provides a helper to push new hashes
 *  - resolves the "currentNav" from your navigation array
 */
export default function useHashRouter(navigation, defaultSlug = navigation[0].slug) {
  const makeRoute = () => {
    const { slug, operationId, subTab, params } = parseHash();
    return navigation.some((n) => n.slug === slug)
      ? { slug, operationId, subTab, params }
      : { slug: defaultSlug, operationId: null, subTab: null, params: {} };
  };

  const [route, setRoute] = useState(() => {
    if (typeof window === 'undefined') {
      return { slug: defaultSlug, operationId: null, subTab: null, params: {} };
    }
    return makeRoute();
  });

  // keep route in sync with back/forward
  useEffect(() => {
    const onHashChange = () => setRoute(makeRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // helper to change to a top-level tab
  const handleTabClick = (navItem) => {
    window.history.pushState(null, '', `#${navItem.slug}`);
    setRoute({ slug: navItem.slug, operationId: null, subTab: null, params: {} });
  };

  const currentNav = navigation.find((n) => n.slug === route.slug) || navigation[0];

  return { route, currentNav, handleTabClick };
}
