import { useEffect, useState, useCallback } from 'react';

type SoundItem = { name: string; src: string };

const DEFAULTS = ['Mensagem de Texto 1.mp3', 'Mensagem de Texto 2.mp3', 'Mensagem de Texto 3.mp3'];
const CUSTOM_STORAGE_KEY = 'custom-sound-library';

export function useSoundLibrary() {
  const [sounds, setSounds] = useState<SoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fileToUrl = useCallback((base: '/sunds' | '/sounds', filename: string) => {
    return `${base}/${encodeURIComponent(filename)}`;
  }, []);

  const addUnique = (items: SoundItem[]) => {
    setSounds(prev => {
      const map = new Map<string, SoundItem>();
      [...prev, ...items].forEach(i => map.set(i.name, i));
      return Array.from(map.values());
    });
  };

  const loadManifest = useCallback(async () => {
    const manifests = ['/sounds/sounds.json', '/sunds/sounds.json'];
    for (const m of manifests) {
      try {
        const res = await fetch(m, { cache: 'no-cache' });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            const base = m.startsWith('/sunds') ? '/sunds' : '/sounds';
            const items = list
              .filter((n) => typeof n === 'string' && (n.toLowerCase().endsWith('.mp3') || n.toLowerCase().endsWith('.wav')))
              .map((n) => ({ name: n, src: fileToUrl(base, n) }));
            addUnique(items);
          }
        }
      } catch { /* ignore */ }
    }
  }, [fileToUrl]);

  const loadDefaults = useCallback(() => {
    addUnique(DEFAULTS.map(n => ({ name: n, src: fileToUrl('/sounds', n) })));
  }, [fileToUrl]);

  const loadCustomStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
      if (raw) {
        const list: string[] = JSON.parse(raw);
        addUnique(list.map(n => ({ name: n, src: fileToUrl('/sounds', n) })));
      }
    } catch { /* ignore */ }
  }, [fileToUrl]);

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
    const urls = [fileToUrl('/sounds', clean), fileToUrl('/sunds', clean)];
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
  }, [fileToUrl]);

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
