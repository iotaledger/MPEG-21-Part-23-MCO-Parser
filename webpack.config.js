const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    filename: 'mco-parser.min.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'mcoParser',
  },
  resolve: {
    fallback: {
      url: require.resolve('url/'),
    },
  },
  devtool: 'source-map',
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
