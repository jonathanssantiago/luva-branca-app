const { withPodfile } = require('@expo/config-plugins')

const fmtPostInstallPatch = `    # fmt 11.0.2 fails under Apple Clang's C++20 consteval path on current Xcode.
    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'

      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FMT_USE_CONSTEVAL=0'
      end
    end

`

const fmtPostIntegratePatch = `
  post_integrate do |installer|
    Dir.glob(File.join(installer.sandbox.root.to_s, 'Target Support Files', 'fmt', 'fmt.*.xcconfig')).each do |path|
      contents = File.read(path)
      contents = contents.gsub(/CLANG_CXX_LANGUAGE_STANDARD = .*/, 'CLANG_CXX_LANGUAGE_STANDARD = c++17')
      contents = contents.gsub(/GCC_PREPROCESSOR_DEFINITIONS = (.*)/) do
        definitions = Regexp.last_match(1)
        next "GCC_PREPROCESSOR_DEFINITIONS = #{definitions}" if definitions.include?('FMT_USE_CONSTEVAL=0')

        "GCC_PREPROCESSOR_DEFINITIONS = #{definitions} FMT_USE_CONSTEVAL=0"
      end
      File.write(path, contents)
    end
  end
`

module.exports = function withFmtCxx17(config) {
  return withPodfile(config, (podfileConfig) => {
    const contents = podfileConfig.modResults.contents

    if (contents.includes("fmt.*.xcconfig")) {
      return podfileConfig
    }

    const withPostInstallPatch = contents.replace(
      /(\s+react_native_post_install\([\s\S]*?\n\s+?\)\n)/m,
      `$1\n${fmtPostInstallPatch}`,
    )
    podfileConfig.modResults.contents = withPostInstallPatch.replace(
      /\nend\n$/m,
      `${fmtPostIntegratePatch}\nend\n`,
    )

    return podfileConfig
  })
}
