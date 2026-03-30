module.exports = function (api: { cache: (arg0: boolean) => void }) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
      '@nozbe/watermelondb/babel/plugin',
    ],
  }
}
