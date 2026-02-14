const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Resolve "convex/*" from backend/convex (Babel alias + Metro watch)
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, "../backend/convex"),
];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../backend/node_modules"),
];

module.exports = config;
