import { useEffect, useState } from 'react';
import { parseHash, type Route } from '../lib/routes';

/** Current route from location.hash; updates on hashchange (works on first load too). */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', onChange);
    onChange();
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
