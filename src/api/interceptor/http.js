import axios from "axios";
import JwtService from "@/core/services/jwt.service";
import {message_error} from "@/utils/helpers";


const local_url = process.env.VUE_APP_BASE_URL  || document.location.origin;

// 创建 axios 实例
const instance = axios.create({
    baseURL: local_url + (local_url.endsWith("/") ? "api" : "/api"),
    timeout: 1000 * 12,
    headers: {
        'Content-Type': 'application/json',
    }
})

// 刷新 token 方法
function refreshToken() {
    // instance是当前request.js中已创建的axios实例
    return instance.post('/auth/refresh')
}

// 给实例添加一个setToken方法，用于登录后将最新token动态添加到header，同时将token保存在localStorage中
instance.setToken = ({ access_token, expires_in }) => {
    // 设置新的 token
    instance.defaults.headers.Authorization = `Bearer ${access_token}`
    // 保存 token 到 localstorage
    JwtService.saveToken(access_token)
    JwtService.saveExpiresTime(expires_in)
}

// 是否正在刷新的标记
let isRefreshing = false
// 重试队列，每一项将是一个待执行的函数形式
let requests = []

// axios 请求拦截器
instance.interceptors.request.use(
    (config) => {
        // 设置请求头 token
        const token = JwtService.getToken()
        const token_expires_in = JwtService.getExpiresTime()
        token && (config.headers.Authorization = `Bearer ${token}`)

        // 登录接口和刷新token接口绕过，不进入刷新 token 判断
        if (config.url.indexOf('/refresh') >= 0 || config.url.indexOf('/login') >= 0) {
            return config
        }

        const now = Date.now();
        // 没有 token 或者时间大于 expires_in 重定向到登录
        if(!token || !token_expires_in || now > token_expires_in) {
            JwtService.destroyToken()
            window.location.href = '/#/login'
            // return false; // 阻止后面的请求
            return config;
        }
        // 通过时间判断刷新 token
        if (token && token_expires_in) {
            // 小于 20 分钟过期的时候刷新
            if (token_expires_in - now  < 20*60*1000) {
                // 立即刷新token
                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshToken().then(res => {
                        const {access_token, expires_in} = res.data.data
                        instance.setToken({access_token, expires_in});
                        isRefreshing = false;
                        return access_token;
                    }).then((access_token) => {
                        requests.forEach(cb => cb(access_token));
                        // 执行完成后，清空队列
                        requests = []
                    }).catch(() => {
                        // console.error('refresh token error: ', res)
                    })
                }
                const retryOriginalRequest = new Promise((resolve) => {
                    requests.push((access_token) => {
                        // 因为config中的token是旧的，所以刷新token后要将新token传进来
                        console.log("====config", config)
                        config.headers['Authorization'] = `Bearer ${access_token}`;
                        resolve(config)
                    })
                });
                return retryOriginalRequest
            }
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// axios 响应拦截器
instance.interceptors.response.use(
    (response) => {
        const {code, message} = response.data
        // 刷新 token 失败或者 401 返回登录页
        if ((code === 400 && message === "token异常") || code === 401) {
            // console.log('token异常 返回登录')
            JwtService.destroyToken()
            window.location.href = '/#/login'
            return response;
        }

        // 统一处理提示
        if(code !== 200) {
            message_error(message);
            console.log(message);
        }

        return response
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default instance;
