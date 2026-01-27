import { useState, useEffect } from 'react';

const getQuery = (maxWidth: number) => `(max-width: ${maxWidth - 1}px)`;

export const useIsMobile = (maxWidth = 768) => {
  const query = getQuery(maxWidth);

  const getInitialState = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  const [isMobile, setIsMobile] = useState(getInitialState);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Some browsers still use addListener/removeListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      (mediaQuery as any).addListener(handleChange);
    }

    // Sync state immediately in case it changed between render and effect
    setIsMobile(mediaQuery.matches);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        (mediaQuery as any).removeListener(handleChange);
      }
    };
  }, [query]);

  return isMobile;
};
