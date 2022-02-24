// const path = require('path');
const webpack = require("webpack")
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  optimization: {
    minimize: false,
    // minimizer: [
        // new TerserPlugin({
        //     terserOptions: {
        //         keep_classnames: true,
        //         keep_fnames: true
        //     }
        //   })
        // ]
  },
  entry: {
      index: './client/src/js/index'
  },
  output: {
    path: __dirname + '/client/dist',
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ]
      }
    ]
  }
}