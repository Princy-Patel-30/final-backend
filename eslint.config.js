import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': ['error', 'always'],
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'no-duplicate-imports': 'error',
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'no-process-exit': 'warn',
      'no-undef': 'error',
      'no-unused-expressions': 'error',
      'no-useless-escape': 'error',
      'no-throw-literal': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-redeclare': 'error',
      'no-shadow': 'error',
      'no-async-promise-executor': 'error',
      'no-return-await': 'error',
    },
  },

  prettier,
]);
