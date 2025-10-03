// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove 'wasm' da lista de extensões de código-fonte que o Babel tentará transpilar.
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== 'wasm'
);

// Adiciona 'wasm' (e 'db') à lista de recursos (assets).
config.resolver.assetExts.push('wasm', 'db');

module.exports = config;