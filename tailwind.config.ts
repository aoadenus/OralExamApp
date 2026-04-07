import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        paper: '#f8fafc',
        line: '#dbe3ef',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
