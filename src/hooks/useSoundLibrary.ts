import { useEffect, useState, useCallback } from 'react';

type SoundItem = { name: string; src: string };

const DEFAULTS = ['notification.mp3', 'notification2.mp3', 'notification3.mp3'];
const CUSTOM_STORAGE_KEY = 'custom-sound-library';

export function useSoundLibrary() {
  const [sounds, setSounds] = useState<SoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  const addUnique = (items: SoundItem[]) => {
    setSounds(prev => {
      const map = new Map<string, SoundItem>();
      [...prev, ...items].forEach(i => map.set(i.name, i));
      return Array.from(map.values());
    });
  };

  const loadManifest = useCallback(async () => {
    const manifests = ['/sunds/sounds.json', '/sond/sounds.json', '/sounds/sounds.json'];
    for (const m of manifests) {
      try {
        const res = await fetch(m, { cache: 'no-cache' });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            const items = list
              .filter((n) => typeof n === 'string' && (n.toLowerCase().endsWith('.mp3') || n.toLowerCase().endsWith('.wav')))
              .map((n) => ({ name: n, src: m.startsWith('/sunds') ? `/sunds/${n}` : m.startsWith('/sond') ? `/sond/${n}` : `/sounds/${n}` }));
            addUnique(items);
            break;
          }
        }
      } catch { /* ignore */ }
    }
  }, []);

  const loadDefaults = useCallback(() => {
    addUnique(DEFAULTS.map(n => ({ name: n, src: `/sunds/${n}` })));
  }, []);

  const loadCustomStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
      if (raw) {
        const list: string[] = JSON.parse(raw);
        addUnique(list.map(n => ({ name: n, src: `/sond/${n}` })));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      loadDefaults();
      loadCustomStorage();
      await loadManifest();
      setLoading(false);
    })();
  }, [loadDefaults, loadCustomStorage, loadManifest]);

  const addIfExists = useCallback(async (filename: string) => {
    const clean = filename.trim();
    if (!clean) return false;
    const urls = [`/sunds/${clean}`, `/sond/${clean}`, `/sounds/${clean}`];
    for (const u of urls) {
      try {
        const res = await fetch(u, { method: 'HEAD' });
        if (res.ok) {
          addUnique([{ name: clean, src: u }]);
          try {
            const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
            const list: string[] = raw ? JSON.parse(raw) : [];
            if (!list.includes(clean)) {
              list.push(clean);
              localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(list));
            }
          } catch { /* ignore */ }
          return true;
        }
      } catch { /* ignore */ }
    }
    return false;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setSounds([]);
    loadDefaults();
    loadCustomStorage();
    await loadManifest();
    setLoading(false);
  }, [loadDefaults, loadCustomStorage, loadManifest]);

  return { sounds, loading, addIfExists, reload };
}
