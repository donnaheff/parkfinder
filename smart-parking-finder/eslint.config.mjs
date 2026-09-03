import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // This app is deliberately pure client-side rendering (no SSR/SWR/React
      // Query layer): every page fetches on mount inside a plain useEffect,
      // which is exactly the pattern this rule flags. Downgraded rather than
      // disabled so a genuinely new problem still shows up as a warning.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/**',
    'backend/**',
  ]),
]);

export default eslintConfig;
