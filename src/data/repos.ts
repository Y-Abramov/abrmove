// GitHub repo name per module slug (Y-Abramov org) — single source for
// release/download-count fetches, shared by releases.ts and Hero.astro.
export const MODULE_REPOS: Record<string, string> = {
  'abr-modules': 'abrmodules',
  'quick-commands': 'quickcommands',
  'cursor-sync': 'cursorsync',
  'road-style': 'RoadStyle',
  'model-desk': 'ModelDesk',
  'pave-plan': 'PavePlan',
  'abr-theme': 'AbrTheme',
};

// .tpm filename prefix per module slug, matching AbrModules/robur-modules catalog.json
// and the Yandex Object Storage mirror (storage.yandexcloud.net/abrmove-modules/tpm/).
export const MODULE_TPM_PREFIX: Record<string, string> = {
  'abr-modules': 'AbrModules',
  'quick-commands': 'QuickCommands',
  'cursor-sync': 'CursorSync',
  'road-style': 'RoadStyle',
  'model-desk': 'ModelDesk',
  'pave-plan': 'PavePlan',
  'abr-theme': 'AbrTheme',
};
