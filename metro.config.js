const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Minify the JavaScript bundle
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
  output: {
    ascii_only: true,
    quote_style: 3,
    wrap_iife: true,
  },
  sourceMap: {
    includeSources: false,
  },
  toplevel: false,
  compress: {
    drop_console: true,
    drop_debugger: true,
    reduce_funcs: false,
  },
}

// Enable tree shaking for smaller bundles
config.transformer.enableBabelRCLookup = false

// Optimize asset resolution
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg',
)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg']

module.exports = config
