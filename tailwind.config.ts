import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#27212d',
        plum: '#563b63',
        coral: '#e7755b',
        mist: '#f7f4f2',
      },
    },
  },
  plugins: [],
};

export default config;