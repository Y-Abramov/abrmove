// Reads the counter object the download-counter Cloud Function maintains
// (see functions/download-counter/) — build-time fetch, same fail-soft
// pattern as releases.ts: any failure just yields an empty count, never breaks the page.
const COUNTERS_URL = 'https://storage.yandexcloud.net/abrmove-modules/_meta/counters.json';

export type Counters = Record<string, number>;

let cache: Promise<Counters> | null = null;

function getYandexCounters(): Promise<Counters> {
  if (!cache) {
    cache = fetch(COUNTERS_URL)
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
  }
  return cache;
}

export async function getCounterFor(type: 'module' | 'tool', slug: string): Promise<number> {
  const counters = await getYandexCounters();
  return counters[`${type}:${slug}`] ?? 0;
}

export async function getYandexModuleTotal(): Promise<number> {
  const counters = await getYandexCounters();
  let total = 0;
  for (const [key, count] of Object.entries(counters)) {
    if (key.startsWith('module:')) total += count;
  }
  return total;
}
