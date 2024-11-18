module.exports = {
  env: {
    jest: true,
    node: true,
  },
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:json/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'simple-import-sort',
    'import',
    'prettier',
    'sort-keys-fix',
    'typescript-sort-keys',
    'sort-destructure-keys',
  ],
  root: true,
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Node.js builtins. You could also generate this regex if you use a `.js` config.
          // For example: `^(${require("module").builtinModules.join("|")})(/|$)`
          [
            '^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)',
          ],
          // Packages.
          ['^@?\\w'],
          // Platform packages.
          ['^(@rsdk)(/.*|$)'],
          // SIEM packages.
          ['^(@siem)(/.*|$)'],
          // Parent imports. Put `..` last.
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Other relative imports. Put same-folder imports and `.` last.
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
        ],
      },
    ],

    // https://github.com/mthadley/eslint-plugin-sort-destructure-keys
    'sort-destructure-keys/sort-destructure-keys': 'warn',

    // https://github.com/leo-buneev/eslint-plugin-sort-keys-fix
    'sort-keys-fix/sort-keys-fix': ['warn', 'asc', { caseSensitive: true }],

    // https://github.com/infctr/eslint-plugin-typescript-sort-keys/blob/master/docs/rules/interface.md
    'typescript-sort-keys/interface': 'warn',
    // https://github.com/infctr/eslint-plugin-typescript-sort-keys/blob/master/docs/rules/string-enum.md
    'typescript-sort-keys/string-enum': 'warn',
  },
}
