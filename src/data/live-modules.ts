import { modules, popularModules, type ModuleDoc } from './modules';
import { getLiveReleases } from './releases';

async function withLive(list: ModuleDoc[]): Promise<ModuleDoc[]> {
  const live = await getLiveReleases();
  return list.map((m) => (live[m.slug] ? { ...m, version: live[m.slug].version, download: live[m.slug].download } : m));
}

export const getLiveModules = () => withLive(modules);
export const getLivePopularModules = () => withLive(popularModules);
