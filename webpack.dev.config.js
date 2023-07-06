const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const sourceDir = path.resolve(__dirname);
const DEFAULT_WEBPACK_PORT = 3008;

module.exports = {
  mode: "development",
  entry: './src/index.js',

  output: {
    filename: "threedtiles.js",
    path: path.resolve(__dirname, 'dist'),
    globalObject: 'this',
    library: {
      name: 'threedtiles',
      type: 'umd',
    },
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new HtmlWebpackPlugin({
      template: "index.html",
      filename: "index.html",
    }),
    new MiniCssExtractPlugin({
      filename: "[name].bundle.[hash].css"
    }),
    new CopyPlugin({
      patterns: [
        { from: "node_modules/three/examples/jsm/libs/draco", to: "draco-decoders" },
        { from: "node_modules/three/examples/jsm/libs/basis", to: "ktx2-decoders" }
      ],
    }),
  ],

  devtool: "source-map",

  module: {
    rules: [

      {
        test: /\.s[ac]ss$/,
        use: [
          // inserts <link/> tag to generated CSS file, inside the generated index.html
          { loader: MiniCssExtractPlugin.loader },
          "css-loader",
          "resolve-url-loader",
          // Compiles Sass to CSS
          {
            loader: "sass-loader",
            options: {
              sourceMap: true // resolve-url-loader needs sourcemaps, regardless of devtool (cf. resolve-url-loader's README)
            }
          }
        ]
      },
      {
        test: /\.css$/i,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          "style-loader",
          "css-loader",
        ]
      },
      {
        test: /\.html$/i,
        loader: "html-loader"
      },
      { // loader for fonts
        test: /\.(eot|woff|woff2|otf|ttf|svg)$/,
        use: [{
          loader: "file-loader",
          options: {
            name: "fonts/[name].[ext]"
          }
        }]
      },
      { // loader for shaders
        test: /\.glsl$/,
        loader: 'webpack-glsl-loader'
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },

      {
        test: /\.wasm$/,
        type: "webassembly/async",
      },
    ],
  },
  optimization: {
    minimizer: [new TerserPlugin({
      parallel: true,
      terserOptions: {
        ecma: undefined,
        parse: {},
        compress: {},
        mangle: true, // Note `mangle.properties` is `false` by default.
        module: false,
        // Deprecated
        output: null,
        format: null,
        toplevel: false,
        nameCache: null,
        ie8: false,
        keep_classnames: undefined,
        keep_fnames: false,
        safari10: false,
      },
      exclude: []
    })]
  },
  devServer: {
    hot: true,
    open: true,
    port: DEFAULT_WEBPACK_PORT
  },
  resolve: {
    
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],// other stuff
    fallback: {
      "fs": false,
      "path": require.resolve("path-browserify")
    }
  },
  experiments: {
    asyncWebAssembly: true,
  },
};
