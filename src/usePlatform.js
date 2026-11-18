import { reportClientError } from '../lib/errorReporter';
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadPlatform } from '../services/platform';
import { withTimeout, networkMessage } from '../lib/async';
const empty = {
  courses: [],
  modules: [],
  lessons: [],
  progress: [],
  notes: [],
  favorites: [],
  later: [],
  activities: [],
  resources: [],
  exercises: [],
  goal: null,
  quizRequirements: [],
  warnings: [],
};
export function usePlatform() {
  const [data, setData] = useState(empty),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState(''),
    [stale, setStale] = useState(false),
    [lastUpdated, setLastUpdated] = useState(null),
    request = useRef(0),
    mounted = useRef(true),
    hasData = useRef(false),
    lastSuccess = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const refresh = useCallback(async (silent = false) => {
    const current = ++request.current;
    if (mounted.current) {
      if (silent || hasData.current) setRefreshing(true);
      else setLoading(true);
    }
    let response;
    try {
      response = await withTimeout(loadPlatform(), 20000);
    } catch (error) {
      reportClientError(error, { source: 'hooks/usePlatform.js' });
      response = {
        error: networkMessage('O carregamento demorou demais. Tente novamente.'),
      };
    }
    if (!mounted.current || current !== request.current) return;
    if (response.error) {
      setError(response.error);
      setStale(hasData.current);
      if (response.error.includes('sessão expirou')) hasData.current = false;
    } else {
      setData(response.data);
      setError('');
      setStale(false);
      hasData.current = true;
      lastSuccess.current = Date.now();
      setLastUpdated(new Date(lastSuccess.current));
    }
    if (mounted.current && current === request.current) {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const online = () => {
        if (Date.now() - lastSuccess.current > 30000) refresh(true);
      },
      visible = () => {
        if (document.visibilityState === 'visible' && Date.now() - lastSuccess.current > 300000)
          refresh(true);
      };
    addEventListener('online', online);
    document.addEventListener('visibilitychange', visible);
    return () => {
      removeEventListener('online', online);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);
  return {
    data,
    loading,
    refreshing,
    error,
    stale,
    lastUpdated,
    hasData: hasData.current,
    refresh,
  };
}
