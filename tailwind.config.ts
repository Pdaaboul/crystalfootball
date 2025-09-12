import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Crystal Football Brand Colors
        'royal-blue': 'var(--color-royal-blue)',
        'dark-navy': 'var(--color-dark-navy)',
        'light-blue': 'var(--color-light-blue)',
        gold: 'var(--color-gold)',
        'deep-gold': 'var(--color-deep-gold)',
        cyan: 'var(--color-cyan)',
        charcoal: 'var(--color-charcoal)',
        'white-text': 'var(--color-white)',

        // Semantic Color System
        background: 'var(--color-background)',
        'background-alt': 'var(--color-background-alt)',
        foreground: 'var(--color-foreground)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--muted-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        border: 'var(--color-border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Consolas', 'monospace'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          md: '2rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1400px',
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { boxShadow: '0 0 20px rgba(163, 223, 255, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(163, 223, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
