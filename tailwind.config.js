/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Shadcn color system with proper light/dark variants
        background: {
          DEFAULT: 'var(--color-background)',
          light: '#ffffff',
          dark: '#0b0f14',
        },
        foreground: {
          DEFAULT: 'var(--color-foreground)',
          light: '#111827',
          dark: '#e5e7eb',
        },
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
          light: '#ffffff',
          dark: '#12161b',
        },
        popover: {
          DEFAULT: 'var(--color-popover)',
          foreground: 'var(--color-popover-foreground)',
          light: '#ffffff',
          dark: '#12161b',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
          light: '#1d4ed8',
          dark: '#BC78F9',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
          light: '#f3f4f6',
          dark: '#1f2937',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
          light: '#f3f4f6',
          dark: '#1f2937',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
          light: '#f3f4f6',
          dark: '#1f2937',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
          light: '#ef4444',
          dark: '#ef4444',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          light: '#e5e7eb',
          dark: '#1f2937',
        },
        input: {
          DEFAULT: 'var(--color-input)',
          light: '#e5e7eb',
          dark: '#1f2937',
        },
        ring: {
          DEFAULT: 'var(--color-ring)',
          light: '#BC78F9',
          dark: '#BC78F9',
        },
        
        // Custom sandbox variables with light/dark variants
        surface: {
          DEFAULT: 'var(--surface)',
          light: '#f9fafb',
          dark: '#12161b',
          '2': {
            DEFAULT: 'var(--surface-2)',
            light: '#eef2f7',
            dark: '#151a20',
          },
        },
        text: {
          custom: {
            DEFAULT: 'var(--text-custom)',
            light: '#111827',
            dark: '#e5e7eb',
          },
          dim: {
            DEFAULT: 'var(--text-dim)',
            light: '#374151',
            dark: '#a9b1bb',
          },
        },
        primary: {
          custom: {
            DEFAULT: 'var(--primary-custom)',
            light: '#BC78F9',
            dark: '#BC78F9',
            strong: {
              DEFAULT: 'var(--primary-strong)',
              light: '#2563eb',
              dark: '#2563eb',
            },
          },
        },
        accent: {
          custom: {
            DEFAULT: 'var(--accent-custom)',
            light: '#bc78f9',
            dark: '#bc78f9',
          },
        },
        
        // Status colors
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        
        // Sidebar colors
        sidebar: {
          DEFAULT: 'var(--color-sidebar)',
          foreground: 'var(--color-sidebar-foreground)',
          primary: 'var(--color-sidebar-primary)',
          'primary-foreground': 'var(--color-sidebar-primary-foreground)',
          accent: 'var(--color-sidebar-accent)',
          'accent-foreground': 'var(--color-sidebar-accent-foreground)',
          border: 'var(--color-sidebar-border)',
          ring: 'var(--color-sidebar-ring)',
        },
        
        // Chart colors
        chart: {
          '1': 'var(--color-chart-1)',
          '2': 'var(--color-chart-2)',
          '3': 'var(--color-chart-3)',
          '4': 'var(--color-chart-4)',
          '5': 'var(--color-chart-5)',
        },
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
    },
  },
  plugins: [],
}




