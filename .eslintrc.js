const prettierConfig = require('eslint-config-prettier')
const typescriptPlugin = require('@typescript-eslint/eslint-plugin')
const typescriptParser = require('@typescript-eslint/parser')
const reactPlugin = require('eslint-plugin-react')
const reactNativePlugin = require('eslint-plugin-react-native')
const prettierPlugin = require('eslint-plugin-prettier')

module.exports = [
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['node_modules/', 'build/', 'dist/'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      react: reactPlugin,
      'react-native': reactNativePlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'warn',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]
