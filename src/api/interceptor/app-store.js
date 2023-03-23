
import axios from "axios";
import Store from "@/core/services/app-store.service"

const baseUrl = process.env.NODE_ENV === "production" ? 'http://119.91.238.241:8900' : '/store';

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