import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        paper: '#f8fafc',
        line: '#dbe3ef',
        'arcade-bg': '#070B14',
        'arcade-surface': '#101826',
        'arcade-primary': '#00E5FF',
        'arcade-accent': '#7C4DFF',
        'arcade-success': '#00F5A0',
        'arcade-warning': '#FFB800',
        'arcade-danger': '#FF4D6D',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(15, 23, 42, 0.08)',
        'neon-cyan': '0 0 25px rgba(0, 229, 255, 0.12)',
        'neon-purple': '0 0 25px rgba(124, 77, 255, 0.12)',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        fira: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
