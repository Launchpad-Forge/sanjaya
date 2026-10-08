import { useEffect, useState } from 'react';

/** Calls fetcher every `ms` until it returns something whose status is not "processing". */
export default function usePoll(fetcher, key, ms = 4000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!key) return undefined;
    let stop = false;
    let timer;
    setData(null);
    setError(null);
    const tick = async () => {
      try {
        const d = await fetcher(key);
        if (stop) return;
        setData(d);
        if (d.status === 'processing') timer = setTimeout(tick, ms);
      } catch (e) {
        if (!stop) setError(e.message);
      }
    };
    tick();
    return () => { stop = true; clearTimeout(timer); };
  }, [fetcher, key, ms]);
  return { data, error, setData };
}
