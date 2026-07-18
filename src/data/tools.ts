// Extra tools (Dynamo scripts, utilities) — NOT ABR modules. Civil 3D / Robur.
export interface Tool {
  slug: string;
  name: string;
  platform: 'robur' | 'civil';
  tags: string[];          // shown as badges in the catalog table
  short: string;           // one-line, catalog row
  description: string;     // detail page
  steps: string[];         // how to run
  download?: string;
  downloadLabel?: string;
  video?: string;          // /public path
}

export const tools: Tool[] = [
  {
    slug: 'dynamo-elevations',
    name: 'Массовое изменение отметок',
    platform: 'civil',
    tags: ['Civil 3D', 'Dynamo', 'Отметки'],
    short: 'Массово меняет отметки характерных линий и профилей — сместить площадку без ручной правки каждой точки.',
    description:
      'Dynamo-скрипт для Civil 3D: массово меняет отметки характерных линий и профилей. Пригодится, когда нужно быстро сместить площадку или другой объект на заданную величину, без ручного редактирования каждой отметки.',
    steps: [
      'Откройте скрипт через Проигрыватель Dynamo (вкладка «Управление»).',
      'Выберите нужные объекты — характерные линии или профили.',
      'Укажите величину смещения. Скрипт применит её ко всем выбранным отметкам.',
    ],
    download: 'https://storage.yandexcloud.net/abrmove-modules/tools/dynamo-elevations.dyn',
    downloadLabel: 'Скачать скрипт',
    video: '/tools/dynamo-elevations.mp4',
  },
];

export const toolsByPlatform = {
  robur: tools.filter((t) => t.platform === 'robur'),
  civil: tools.filter((t) => t.platform === 'civil'),
};
