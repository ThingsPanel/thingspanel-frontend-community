import http from "axios";
import RED from "../core/services/red.module";
export const red_url = process.env.VUE_APP_RED_BASE_URL + ":" + process.env.VUE_APP_RED_PORT;

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

export default instance;