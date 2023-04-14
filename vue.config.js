
// const path = require("path");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
    // publicPath: "",
    productionSourceMap: false, // 生产打包时不输出map文件
    // runtimeCompiler: true,
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
                target: process.env.VUE_APP_STORE_BASE_URL,
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
                // vue$: "vue/dist/vue.runtime.esm.js" // 'vue/dist/vue.runtime.common.js' for webpack 1
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
        ]
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
