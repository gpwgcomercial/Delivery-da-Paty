import type { Config } from 'tailwindcss';

// Mesma paleta e tokens usados nos protótipos HTML (cupcake + capacete de entrega)
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FDF1EF',
        surface: '#FFFFFF',
        ink: '#2A1620',
        inkSoft: '#7A5C66',
        primary: '#7A2E49',
        primaryDeep: '#5C2038',
        accent: '#FF7A3D',
        accentSoft: '#FFE3CC',
        gold: '#F2B33D',
        line: '#EFDCD8',
        ok: '#4B7B3F',
        okSoft: '#E4EFCB',
        danger: '#B23B3B',
        dangerSoft: '#F6DCDC',
        warn: '#A85A28',
        warnSoft: '#FBE7D3',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-karla)', 'sans-serif'],
      },
      borderRadius: {
        l: '22px',
        m: '14px',
        s: '10px',
      },
    },
  },
  plugins: [],
};

export default config;
