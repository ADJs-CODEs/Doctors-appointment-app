const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const withCss = withNativewind(config);
const nativewindResolve = withCss.resolver.resolveRequest;

// NativeWind swaps `react-native` for its own wrapper so `className` works on our screens. Its
// wrapper is behind React Native 0.88 (no AssetRegistry, NativeComponentRegistry...), which broke
// fonts, icons and Expo's native views. Libraries in node_modules get the real react-native.
withCss.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native" && /[\\/]node_modules[\\/]/.test(context.originModulePath)) {
    return context.resolveRequest(context, moduleName, platform);
  }
  return nativewindResolve(context, moduleName, platform);
};

module.exports = withCss;
