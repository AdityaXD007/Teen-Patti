const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFirebaseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(file, 'utf8');

      const modularHeadersConfig = `
  # Added by withFirebaseModularHeaders plugin
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseCoreInternal', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true
`;

      if (!contents.includes('FirebaseCoreInternal')) {
        contents = contents.replace(
          /post_install do \|installer\|/g,
          `${modularHeadersConfig}\n  post_install do |installer|`
        );
        fs.writeFileSync(file, contents);
      }

      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;
