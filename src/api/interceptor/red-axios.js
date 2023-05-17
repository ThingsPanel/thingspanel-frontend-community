/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 16:29:08
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-20 15:09:41
 * @FilePath: \ThingsPanel-Backend-Vue\src\api\red-axios.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import http from "axios";
import RED from "@/core/services/red.module";
import {message_error} from "@/utils/helpers";


const red_url =  process.env.VUE_APP_RED_BASE_URL || (document.location.protocol + "//" + document.location.hostname + ":1880");


// 创建 node-red 的 axios 实例
const instance = http.create({
    baseURL: red_url,
    timeout: 1000 * 12,
    headers: {
        'Content-Type': 'application/json',
    }
})
instance.interceptors.request.use(
    (config) => {
        // 设置请求头 token
        const red_token = RED.getRedToken();
        // const red_token_expires_in = RED.getRedTokenExpired();

        // red_token && (config.headers.Authorization = `Bearer ${red_token}`)

        // const now = Date.now();

        if(red_token) {
            config.headers.Authorization = "Bearer " + red_token;
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