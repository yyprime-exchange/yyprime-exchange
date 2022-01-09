/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require("dotenv");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { join, resolve } = require("path");

const withTM = require("next-transpile-modules");

dotenv.config({ path: join(__dirname, `../../.env.${process.env.CHANNEL}`) });

console.log("Cluster:", process.env.NETWORK);
console.log("RPC_URL:", process.env.RPC_URL);

const workspace = join(__dirname, "..");


const WatchExternalFilesPlugin = function (folders) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  WatchExternalFilesPlugin.prototype.apply = (compiler) => {
    compiler.hooks.emit.tap("afterCompile", (compilation) => {
      folders
        .map((path) => resolve(__dirname, path))
        .forEach((path) => {
          return compilation.contextDependencies.add(path);
        });
    });
  };
};

const nextJsConfig = {
  webpack5: true,
  cssModules: true,
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    //avalaible in build time
    NETWORK: process.env.NETWORK,
    CHANNEL: process.env.CHANNEL,
    VERSION: process.env.VERSION,
    //avalaible in run-time
    NEXT_PUBLIC_NETWORK: process.env.NETWORK,
    NEXT_PUBLIC_CHANNEL: process.env.CHANNEL,
    NEXT_PUBLIC_VERSION: process.env.VERSION,
    NEXT_PUBLIC_RPC_URL: process.env.RPC_URL,
  },
  webpack: (config, options) => {
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.(js|jsx|ts|tsx)$/,
          include: [workspace],
          exclude: /node_modules/,
          use: options.defaultLoaders.babel,
        },
        {
          test: /\.svg$/,
          loader: "@svgr/webpack",
        },
      ],
    };
    if (!options.isServer) {
      config.resolve.fallback.fs = false;
      config.resolve.fallback.path = false;
    }
    if (process.env.BUNDLE_ANALYZER === "true") {
      config.plugins.push(new BundleAnalyzerPlugin());
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      "@solana/web3.js": resolve(__dirname, "node_modules", "@solana/web3.js"),
      buffer: resolve(__dirname, "node_modules", "buffer"),
      "@solana/spl-token": resolve(
        __dirname,
        "node_modules",
        "@solana/spl-token"
      ),
      "bn.js": resolve(__dirname, "node_modules", "bn.js"),
      borsh: resolve(__dirname, "node_modules", "borsh"),
      "@project-serum/anchor": resolve(
        __dirname,
        "node_modules",
        "@project-serum/anchor"
      ),
      "@project-serum/common": resolve(
        __dirname,
        "node_modules",
        "@project-serum/common"
      ),
      "@project-serum/serum": resolve(
        __dirname,
        "node_modules",
        "@project-serum/serum"
      ),
      "@project-serum/token": resolve(
        __dirname,
        "node_modules",
        "@project-serum/token"
      ),
    };
    return config;
  },
};

const withTMConfig = withTM(["@saberhq/use-solana", "@gokiprotocol/walletkit"]);

module.exports = withTMConfig(nextJsConfig);
