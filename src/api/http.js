import axios from "axios";
import { saveToken, getToken } from "@/core/services/jwt.service";

const local_url =
    (process.env.VUE_APP_BASE_URL ||
        document.location.protocol + "//" + document.domain + ":9999/");

// 创建 axios 实例
const instance = axios.create({
    baseURL: local_url,
    timeout: 1000 * 12,
    headers: {
        'Content-Type': 'application/json',
    }
})

function refreshToken () {
    // instance是当前request.js中已创建的axios实例
    return instance.post('/api/auth/refresh').then(res => res.data)
}

// 给实例添加一个setToken方法，用于登录后将最新token动态添加到header，同时将token保存在localStorage中
instance.setToken = (obj) => {
    let jwt_token = obj.acces_token
    // 设置新的 token
    instance.defaults.headers.Authorization = `Bearer ${jwt_token}`
    // 保存 token 到 localstorage
    saveToken(jwt_token)
}

// axios 请求拦截器
instance.interceptors.request.use(
    (config) => {
        // 设置请求头 token
        const token = getToken()
        token && (config.headers.Authorization = `Bearer ${token}`)

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 是否正在刷新的标记
let isRefreshing = false
// 重试队列，每一项将是一个待执行的函数形式
let requests = []
// axios 响应拦截器
instance.interceptors.response.use(
    (response) => {
        const { code } = response.data
        // htpp200 code=401 "Unauthorized" token 过期
        if(code == 401) {
            // 请求的配置
            const config = response.config
            if(!isRefreshing) {
                // 设置刷新状态防止多次请求
                isRefreshing = true
                // 刷新 token
                return refreshToken().then((res) => {
                    // http200 code200正常，http200 code400刷新失败
                    // 刷新 token 失败，返回登录页
                    if(res.data.code != 200){
                        window.location.href = '/'
                        return false
                    }

                    // 刷新成功保存token
                    let {data} = res.data;
                    instance.setToken(data)
                    // 设置请求头
                    config.headers.Authorization = data.acces_token
                    // config.baseURL = ''

                    // 已经刷新了token，将所有队列中的请求进行重试
                    requests.forEach(cb => cb(data.acces_token))
                    // 重试完清空队列
                    requests = []
                    return instance(config)
                }).catch(res=>{
                    console.error('refreshtoken error=>', res)
                    window.location.href = '/'
                }).finally(()=>{
                    isRefreshing = false
                })

            } else {
                // 正在刷新token，将返回一个未执行resolve的promise
                // 并发请求添加到队列中，刷新token成功后再执行
                return new Promise((resolve) => {
                    // 将resolve放进队列，用一个函数形式来保存，等token刷新后直接执行
                    requests.push((token) => {
                        config.baseURL = ''
                        config.headers.Authorization = token
                        resolve(instance(config))
                    })
                })
            }
        }

        return response
    },
    (error) => {
       return Promise.reject(error)
    }
)

export default instance;
