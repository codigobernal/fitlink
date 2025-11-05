module.exports = function (api) {
  api.cache(true);
  return {
    // Minimal, compatible with Expo SDK 54 + expo-router
    presets: ["babel-preset-expo"],
    plugins: ["expo-router/babel"],
  };
};
