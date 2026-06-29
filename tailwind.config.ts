import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Accento primario Fosforo (ciano)
        sass: {
          50:  '#ecf8fd',
          100: '#d0eefb',
          200: '#a6e0f7',
          300: '#6ccaee',
          400: '#33b0e0',
          500: '#0f9bd8',
          600: '#0c87bf',
          700: '#0a6e9c',
          800: '#0d597d',
          900: '#114a67',
          950: '#0a2f44',
        },
        // Colori dei laboratori (palette spirale)
        lab: {
          blue:   '#3db3e4',
          green:  '#46b25e',
          indigo: '#6a5cc7',
          teal:   '#16b39a',
          pink:   '#e85aa0',
          orange: '#f08c2e',
          yellow: '#f3c52e',
        },
        ink: {
          DEFAULT: '#1d1b16',
          soft:    '#5c5448',
          faint:   '#9a8f7e',
        },
        // Marrone dei titoli (dal manifesto)
        brown: '#412821',
        paper: '#efe6d6',
      },
      fontFamily: {
        sans: ['Hanken Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Barlow Condensed', 'Hanken Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
