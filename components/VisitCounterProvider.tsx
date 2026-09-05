import React, { createContext, useContext, useEffect, useState } from 'react';
import { APP_CONTENT } from '../constants';

const VisitCountContext = createContext<number | null>(null);

let countRequest: Promise<number | null> | null = null;

function requestVisitCount(): Promise<number | null> {
  if (countRequest) return countRequest;

  countRequest = (async () => {
    const endpoint = APP_CONTENT.googleScriptUrl;
    if (!endpoint || !endpoint.startsWith('http')) return null;

    try {
      const alreadyCounted = sessionStorage.getItem('has_counted_visit') === 'true';
      const action = alreadyCounted ? 'get_visit' : 'visit';
      const separator = endpoint.includes('?') ? '&' : '?';
      const response = await fetch(
        `${endpoint}${separator}action=${action}&t=${Date.now()}`,
        { method: 'GET', redirect: 'follow' }
      );

      const contentType = response.headers.get('content-type');
      if (!response.ok || contentType?.includes('text/html')) return null;

      const data = await response.json();
      if (typeof data?.count !== 'number') return null;

      sessionStorage.setItem('has_counted_visit', 'true');
      return data.count;
    } catch (error) {
      console.warn('Failed to fetch/update visit count:', error);
      return null;
    }
  })();

  return countRequest;
}

export const VisitCounterProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [visitCount, setVisitCount] = useState<number | null>(null);

  useEffect(() => {
    requestVisitCount().then(setVisitCount);
  }, []);

  return (
    <VisitCountContext.Provider value={visitCount}>
      {children}
    </VisitCountContext.Provider>
  );
};

export function useVisitCount(): number | null {
  return useContext(VisitCountContext);
}
