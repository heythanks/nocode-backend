module.exports = {
  'root': true,
  'env': {
    'node': true,
    'commonjs': true,
    'es2020': true
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'ecmaVersion': 2020
  },
  'rules': {
    'no-console': 'error',
    'no-debugger': 'off',
    'dot-notation': 'off',
    'no-unused-vars': 'off',
    'handle-callback-err': 'error',
    'prefer-destructuring': ['error', { object: true, array: false }]
  }
};
