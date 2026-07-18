// Download counter/redirect Cloud Function base URL (see functions/download-counter/).
// Unset until the function is deployed — falls back to the direct storage link so
// buttons keep working with no count before then. Set via .env / CI build env.
export const COUNTER_ENDPOINT = import.meta.env.PUBLIC_COUNTER_URL ?? '';

export function downloadHref(
  type: 'module' | 'tool',
  slug: string,
  fallback: string,
  version?: string
): string {
  if (!COUNTER_ENDPOINT) return fallback;
  const params = new URLSearchParams({ type, slug });
  if (version) params.set('version', version);
  return `${COUNTER_ENDPOINT}?${params.toString()}`;
}
