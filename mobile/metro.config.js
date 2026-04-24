const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Include `../shared` so changes to shared types hot-reload without publishing.
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch `../shared` for changes.
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve modules from both mobile/node_modules and root
//    node_modules (useful for shared helpers that might need a peer dep).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Block the web's node_modules from leaking into the mobile bundle. Next
//    builds in the parent project and we don't want its binaries in the RN
//    bundle.
config.resolver.blockList = [
  new RegExp(`${path.resolve(workspaceRoot, '.next')}/.*`),
];

module.exports = withNativeWind(config, {
  input: './global.css',
});
