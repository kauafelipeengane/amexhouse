import { useEffect } from 'react';
export function useRouteFocus(key, label = 'Página atual') {
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      const main = document.querySelector('#main-content'),
        heading = main?.querySelector('h1');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      } else main?.focus({ preventScroll: true });
      const live = document.querySelector('#route-announcer');
      if (live) live.textContent = label;
    });
    return () => cancelAnimationFrame(timer);
  }, [key, label]);
}
