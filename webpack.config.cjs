const path = require("path");

module.exports = {
  entry: "./index.browser.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    library: "loggle",
    libraryTarget: "umd",
  },
  optimization: { minimize: true, usedExports: false },
  mode: "production",
};
