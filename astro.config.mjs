import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://abrmove.ru',

  server: {
    host: '127.0.0.1',
    port: 4321,
  },

  adapter: cloudflare()
});