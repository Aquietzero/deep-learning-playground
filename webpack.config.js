const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const devMode = process.env.NODE_ENV !== 'production'

module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  devServer: {
    port: 9966,
    static: {
      serveIndex: true,
      directory: __dirname
    },
    historyApiFallback: true,
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: devMode ? '/dist/' : '/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@DLPlayground': path.resolve(__dirname, 'src'),
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: [{
          loader: 'style-loader',
        }, {
          loader: 'css-loader',
        }, {
          loader: 'less-loader',
        }]
      },
      {
        test: /\.css$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
        ],
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      inject: false,
      template: './index.html',
    })
  ],
  watchOptions: {
    ignored: /node_modules/
  }
}
