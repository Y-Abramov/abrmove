import { MODULE_REPOS, MODULE_TPM_PREFIX } from './repos';

export interface ReleaseInfo {
  version: string;
  download: string;
}

// Version number comes from the GitHub API — this runs at build time on the
// GitHub Actions runner, not in the visitor's browser, so it's unaffected by
// a blocked github.com for RU users. The download link handed to the browser
// is built separately, pointing at the Yandex Object Storage mirror (which
// AbrModules/robur-modules' sync-yandex.yml workflow keeps in sync) so it
// works even when github.com itself is unreachable for the visitor.
async function fetchLatestVersion(repo: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/Y-Abramov/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'abr-move-site' },
    });
    if (!res.ok) return null;
    const rel = await res.json();
    const version = String(rel.tag_name ?? '').replace(/^v/, '');
    return version || null;
  } catch {
    return null;
  }
}

function yandexDownloadUrl(slug: string, version: string): string | null {
  const prefix = MODULE_TPM_PREFIX[slug];
  if (!prefix) return null;
  return `https://storage.yandexcloud.net/abrmove-modules/tpm/${prefix}-${version}.tpm`;
}

// Fetched once per build (module-level cache); pages merge this over the
// static fallback in data/modules.ts so a missing/failed repo just keeps
// its hardcoded version instead of breaking the page.
let cache: Promise<Record<string, ReleaseInfo>> | null = null;

export function getLiveReleases(): Promise<Record<string, ReleaseInfo>> {
  if (!cache) {
    cache = (async () => {
      const out: Record<string, ReleaseInfo> = {};
      await Promise.all(
        Object.entries(MODULE_REPOS).map(async ([slug]) => {
          const repo = MODULE_REPOS[slug];
          const version = await fetchLatestVersion(repo);
          const download = version ? yandexDownloadUrl(slug, version) : null;
          if (version && download) out[slug] = { version, download };
        })
      );
      return out;
    })();
  }
  return cache;
}
