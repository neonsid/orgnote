const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

const defaultWatchFolders = config.watchFolders ?? [projectRoot];
config.watchFolders = [...new Set([...defaultWatchFolders, monorepoRoot])];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = false;

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle react-native internal imports that aren't exposed via exports
  if (moduleName.startsWith("react-native/Libraries/")) {
    const rnPath = path.resolve(monorepoRoot, "node_modules", moduleName);
    // Check if the path exists with .js extension
    const jsPath = rnPath.endsWith(".js") ? rnPath : `${rnPath}.js`;
    try {
      require.resolve(jsPath);
      return { type: "sourceFile", filePath: jsPath };
    } catch {
      // Fall through to default resolution
    }
  }
  
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.serializer.getModulesRunBeforeMainModule = () => [
  path.resolve(projectRoot, "polyfills.ts"),
];

module.exports = config;
