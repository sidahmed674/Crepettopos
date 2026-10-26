import { useEffect, useRef } from 'react';
import { api } from '@/utils/helpers';

export type RealtimeEvent = 'tables' | 'orders' | 'menu' | 'settings';

export function useRealtime(
  onChange: () => void,
  events: RealtimeEvent[] = ['tables', 'orders'],
  pollMs = 30000
): void {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    let disposed = false;
    let debounceTimer: number | null = null;
    let source: EventSource | null = null;

    const trigger = () => {
      if (disposed) return;
      if (debounceTimer !== null) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        cbRef.current();
      }, 400);
    };

    const connect = () => {
      if (disposed) return;
      const token = api.getToken();
      if (!token) {
        window.setTimeout(connect, 3000);
        return;
      }
      source = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
      source.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as { type?: string };
          if (data.type && events.includes(data.type as RealtimeEvent)) trigger();
        } catch {
          /* malformed message */
        }
      };
      source.onerror = () => {
        // EventSource retries on its own while CONNECTING; if the server
        // closed permanently (e.g. expired token), fall back to polling.
        if (source && source.readyState === EventSource.CLOSED) {
          source = null;
        }
      };
    };

    connect();

    const interval = window.setInterval(() => cbRef.current(), pollMs);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      if (debounceTimer !== null) window.clearTimeout(debounceTimer);
      source?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
