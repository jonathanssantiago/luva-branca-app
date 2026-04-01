const { withXcodeProject } = require('@expo/config-plugins')

module.exports = function withEntitlementsModification(config) {
  return withXcodeProject(config, (xcodeConfig) => {
    const project = xcodeConfig.modResults
    const buildConfigurations = project.pbxXCBuildConfigurationSection()

    for (const key in buildConfigurations) {
      const buildConfig = buildConfigurations[key]
      if (
        typeof buildConfig === 'object' &&
        buildConfig.buildSettings &&
        buildConfig.buildSettings.PRODUCT_NAME
      ) {
        buildConfig.buildSettings.CODE_SIGN_ALLOW_ENTITLEMENTS_MODIFICATION =
          'YES'
      }
    }

    return xcodeConfig
  })
}
