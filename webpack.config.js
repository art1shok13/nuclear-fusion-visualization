// const path = require('path');

module.exports = {
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
};