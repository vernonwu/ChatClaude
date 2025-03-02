import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './safelist.txt',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '380px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      touchAction: {
        'pan-y': 'pan-y',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config; 