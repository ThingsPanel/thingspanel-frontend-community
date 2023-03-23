/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-29 14:11:25
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-22 09:34:55
 * @FilePath: \ThingsPanel-Backend-Vue\vue.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

// const path = require("path");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
    // publicPath: "",
    productionSourceMap: false, // 生产打包时不输出map文件
    runtimeCompiler: true,
    devServer: {
        port: 8080,
        host: 'localhost',
        open: true,
        overlay: {
            warnings: false,
            errors: true,
        },
        proxy: {
            "/api": {
                target: process.env.VUE_APP_BASE_URL + "/api",
                changeOrigin: true, // 是否改变域名
                pathRewrite: {
                    // 路径重写
                    "/api": "" // 这个意思就是以api开头的，定向到哪里, 如果你的后边还有路径的话， 会自动拼接上
                }
            },
            "/red": {
                target: process.env.VUE_APP_RED_BASE_URL,
                changeOrigin: true, // 是否改变域名
                pathRewrite: {
                    // 路径重写
                    "/red": ""
                }
            },
            "/store": {
                target: "http://119.91.238.241:8900",
                changeOrigin: true, // 是否改变域名
                pathRewrite: {
                    "^/store": ""
                }
            }
            
        }
    },
    lintOnSave: false,
    configureWebpack: {
        resolve: {
            alias: {
                // If using the runtime only build
                vue$: "vue/dist/vue.runtime.esm.js" // 'vue/dist/vue.runtime.common.js' for webpack 1
                // Or if using full build of Vue (runtime + compiler)
                // vue$: 'vue/dist/vue.esm.js'      // 'vue/dist/vue.common.js' for webpack 1
            }
        },
        plugins: [
            new CompressionPlugin({
                filename: '[path][base].gz',
                algorithm: 'gzip',
                test: /\.js$|\.css$|\.html$/,
                threshold: 10240,
                minRatio: 0.8
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.swf$/,
                    loader: 'url-loader',
                    options: {
                        limit: 10000
                    }
                }
            ]
        },
    },
    css: {
        loaderOptions: {
            postcss: {
                config: {
                    path: __dirname
                }
            },
            scss: {
                prependData: `@import "@/assets/sass/vendors/vue/vuetify/variables.scss";`
            }
        }
    },
    transpileDependencies: ["vuetify"]
};
