const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SourceMapDevToolPlugin = require('webpack/lib/SourceMapDevToolPlugin');
module.exports = {
  target: 'node',
  // mode: 'production',
  entry: path.resolve(__dirname, 'src', 'index.tsx'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index_bundle.js'
  },
  module: {
    rules: [
      // {
      //   test: /\.css$/i,
      //   use: [MiniCssExtractPlugin.loader, "css-loader"],
      // },
      {
        test: /\.(css|sass|scss)$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          }
        ]
      },
      {
        test: /\.js$|ts|jsx|tsx/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        options: { presets: ['@babel/env','@babel/preset-react', "@babel/preset-typescript"] },
      },
        {
          test: /\.(png|jp(e*)g|gif)$/,
          use: ['file-loader'],
        },
        {
          test: /\.svg$/,
          use: ['@svgr/webpack'],
        },
    ]
  },
  resolve: {
    extensions: [
      '.ts',
      '.tsx',
      '.js',
      '.jsx'
    ]
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
  mode: 'production',
  plugins: [
    // new CopyPlugin({
    //   patterns: [{ from: './src/index.html' }],
    // }),
    new SourceMapDevToolPlugin({
      noSources: false,
      module: false,
      columns: false,
    }),

    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'index.html'
    }),
    new MiniCssExtractPlugin(),
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'static',
    //   openAnalyzer: false,
    // })
  ],
  devServer: {
    contentBase: './dist'
  }
};



// module.exports = (env, argv) => {
//   if (argv.hot) {
//     // Cannot use 'contenthash' when hot reloading is enabled.
//     config.output.filename = '[name].[hash].js';
//   }

//   return config;
// };