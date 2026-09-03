import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fcf8fa',
        ink: '#1b1b1d',
        muted: '#45464d',
        line: '#e2e8f0',
        outline: '#c6c6cd',
        frost: '#f6f3f5',
        mist: '#f0edef',
        navy: {
          DEFAULT: '#131b2e',
          hover: '#0c1220',
          muted: '#7c839b',
        },
        accent: {
          DEFAULT: '#006c49',
          muted: '#00714d',
        },
        danger: '#ba1a1a',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      maxWidth: {
        page: '71.25rem',
        reading: '45rem',
      },
      // Task 6 viewports: 320/375 = default, 768 = md, 1024 = lg (desktop nav),
      // 1440/1920 = centered max-w-page.
      boxShadow: {
        lift: '0 8px 24px rgba(19, 27, 46, 0.08)',
        toast: '0 12px 32px rgba(19, 27, 46, 0.12)',
      },
      transitionDuration: {
        stitch: '300ms',
      },
    },
  },
  plugins: [],
};

export default config;
