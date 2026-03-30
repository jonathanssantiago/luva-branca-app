const { withPodfile } = require('@expo/config-plugins')

module.exports = function withSimdjson(config) {
  return withPodfile(config, (podfileConfig) => {
    const contents = podfileConfig.modResults.contents
    if (!contents.includes("pod 'simdjson'")) {
      podfileConfig.modResults.contents = contents.replace(
        /^(target '[^']+' do\n\s+use_expo_modules!)/m,
        "$1\n  pod 'simdjson', path: '../node_modules/@nozbe/simdjson'",
      )
    }
    return podfileConfig
  })
}
