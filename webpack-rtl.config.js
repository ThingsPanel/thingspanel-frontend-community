/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-06 10:45:41
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-09 14:32:07
 * @FilePath: \ThingsPanel-Backend-Vue\webpack-rtl.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * Main file of webpack config for RTL.
 * Please do not modified unless you know what to do
 */
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackRTLPlugin = require("webpack-rtl-plugin");
const WebpackMessages = require("webpack-messages");
const del = require("del");
const webpack = require("webpack");

// theme name
const themeName = "thingspanel";
// global variables
const rootPath = path.resolve(__dirname);
const distPath = rootPath + "/src/assets";

const entries = {
  "css/style.vue": "./src/assets/sass/style.vue.scss"
};

// remove older folders and files
(async () => {
  await del.sync(distPath + "/css", { force: true });
})();

const mainConfig = function() {
  return {
    mode: "development",
    stats: "errors-only",
    performance: {
      hints: false
    },
    entry: entries,
    output: {
      // main output path in assets folder
      path: distPath,
      // output path based on the entries' filename
      filename: "[name].js"
    },
    watchOptions: false,
    resolve: { extensions: [".scss"] },
    plugins: [
      // webpack log message
      new WebpackMessages({
        name: themeName,
        logger: str => console.log(`>> ${str}`)
      }),
      // create css file
      new MiniCssExtractPlugin({
        filename: "[name].css"
      }),
      new WebpackRTLPlugin({
        filename: "[name].rtl.css"
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      {
        apply: compiler => {
          // hook name
          compiler.hooks.afterEmit.tap("AfterEmitPlugin", () => {
            (async () => {
              await del.sync(distPath + "/css/*.js", { force: true });
            })();
          });
        }
      },
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
      })
    ],
    module: {
      noParse: [/videojs-contrib-hls/],
      rules: [
        ...(config.dev.useEslint ? [] : []),
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            {
              loader: "sass-loader",
              options: {
                sourceMap: true
              }
            }
          ]
        }
      ]
    }
  };
};

module.exports = function() {
  return [mainConfig()];
};
