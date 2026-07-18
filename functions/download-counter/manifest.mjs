// Server-side allowlist the function resolves redirect targets from — never
// trust a client-supplied URL. Keep in sync with src/data/repos.ts
// (MODULE_TPM_PREFIX) and src/data/tools.ts (download URLs) by hand; this
// function can't import site TS code at deploy time.

export const MODULE_TPM_PREFIX = {
  'abr-modules': 'AbrModules',
  'quick-commands': 'QuickCommands',
  'cursor-sync': 'CursorSync',
  'road-style': 'RoadStyle',
  'model-desk': 'ModelDesk',
};

export const TOOL_DOWNLOADS = {
  'dynamo-elevations': 'https://storage.yandexcloud.net/abrmove-modules/tools/dynamo-elevations.dyn',
};
