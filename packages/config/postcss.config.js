module.exports = {
  // Require the plugin here so resolution uses this package's node_modules.
  // Consumers (studio/docs/www) load this config via `require('config/postcss.config')`
  // and postcss-load-config would otherwise resolve the plugin name from the app cwd,
  // where `@tailwindcss/postcss` is not installed.
  plugins: [require('@tailwindcss/postcss')],
}
