const { withPodfile } = require('@expo/config-plugins')

module.exports = function withFirebaseModularHeaders(config) {
  return withPodfile(config, (podfileConfig) => {
    const contents = podfileConfig.modResults.contents
    if (!contents.includes('GoogleUtilities')) {
      podfileConfig.modResults.contents = contents.replace(
        /^(target '[^']+' do\n\s+use_expo_modules!)/m,
        "$1\n\n  # Firebase Swift pods require modular headers on these dependencies\n  pod 'GoogleUtilities', :modular_headers => true\n  pod 'FirebaseCore', :modular_headers => true\n  pod 'FirebaseCoreInternal', :modular_headers => true\n  pod 'FirebaseInstallations', :modular_headers => true\n  pod 'GoogleDataTransport', :modular_headers => true",
      )
    }
    return podfileConfig
  })
}
