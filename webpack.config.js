const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    target: 'node',
    mode: 'development',
    entry: "./src/app.ts",
    output: {
      filename: "./app.js",
    },
    externalsPresets: {
      node: true // in order to ignore built-in modules like path, fs, etc. 
    },
    resolve: {
      // Add '.ts' and '.tsx' as resolvable extensions.
      extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
      fallback: { "path": require.resolve("path-browserify") }
    },
    module: {
      rules: [
        // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
        { test: /\.ts?$/, loader: "ts-loader" },
      ],
    },
    plugins: [
      new CopyPlugin({
          patterns: [{
              // Copy static asset files so that they can be served from output directory as swagger-ui-dist does not work
              // with webpack.
              from: path.resolve(__dirname, 'node_modules/swagger-ui-dist/'),
              to: 'node_modules/swagger-ui-dist',
          }],
        }),

  ],
  };
  