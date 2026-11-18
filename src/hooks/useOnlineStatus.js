import { useEffect, useState } from 'react';
export function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  useEffect(() => {
    const yes = () => setOnline(true),
      no = () => setOnline(false);
    addEventListener('online', yes);
    addEventListener('offline', no);
    return () => {
      removeEventListener('online', yes);
      removeEventListener('offline', no);
    };
  }, []);
  return online;
}
