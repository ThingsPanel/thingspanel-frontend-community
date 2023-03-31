/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-20 14:55:11
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-31 08:35:13
 * @FilePath: \ThingsPanel-Backend-Vue\src\api\interceptor\app-store.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import axios from "axios";
import Store from "@/core/services/app-store.service"

const baseUrl = process.env.NODE_ENV === "production" ? 'http://r.thingspanel.cn/' : '/store';

const instance = axios.create({
    baseURL: baseUrl,
    timeout: 1000 * 12,
    headers: {
        'Content-Type': 'application/json;'
    }
})
instance.interceptors.request.use(
    (config) => {
        // 设置请求头 token
        const app_token = Store.getToken();
        if(app_token) {
            config.headers["x-token"] = app_token;
        }
        return config;
    }
);
instance.interceptors.response.use(
    response => {
        return response
    },
    error => {
        return Promise.reject(error)
    }
)

export default instance;