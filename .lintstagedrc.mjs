/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,tsx,js,jsx,mjs,cjs,json,yml,yaml,md}': 'prettier --write',
  '**/.env': (files) => `node scripts/block-env-files.mjs ${files.join(' ')}`,
};
