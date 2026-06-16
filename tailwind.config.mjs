/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        base: '#09090E',
        surface: '#10121A',
        elevated: '#181B27',
        line: '#1C1F2E',
        'line-light': '#282D45',
        white: '#FFFFFF',
        'gray-1': '#E2E4EF',
        'gray-2': '#888BA8',
        'gray-3': '#42466A',
        'gray-4': '#252840',
        accent: '#22D3EE',
        'accent-dim': '#0C4A56',
        'accent-glow': 'rgba(34, 211, 238, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'grid-fine': `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        'grid-coarse': `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        'glow-accent': 'radial-gradient(ellipse 60% 40% at 70% 50%, rgba(34,211,238,0.07) 0%, transparent 70%)',
        'glow-center': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.05) 0%, transparent 60%)',
      },
      backgroundSize: {
        'grid-24': '24px 24px',
        'grid-48': '48px 48px',
        'grid-80': '80px 80px',
      },
      letterSpacing: {
        widest2: '0.2em',
        widest3: '0.3em',
      },
    },
  },
  plugins: [],
};
