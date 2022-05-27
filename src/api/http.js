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
        // 'Authorization': `Bearer ${getToken()}`,
        //'X-Token': getLocalToken() // headers token
    }
})

// function refreshToken(){
//     instance.post('refreshtoken').then(res)
// }

// 给实例添加一个setToken方法，用于登录后将最新token动态添加到header，同时将token保存在localStorage中
instance.setToken = (obj) => {
    let jwt_token = obj.acces_token
    // 设置新的 token
    instance.defaults.headers['Authorization'] = `Bearer ${jwt_token}`
    // 保存 token 到 localstorage
    saveToken(jwt_token)
}

// axios 请求拦截器
instance.interceptors.request.use(
    (config) => {
        const token = getToken()
        token && (config.headers.Authorization = `Bearer ${token}`)

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// axios 响应拦截器
instance.interceptors.response.use(
    (response) => {

        return response
    },
    (error) => {
        // 如果未授权刷新token
        if(error.response.status === '401'){
            console.log(error.response.status)
        }

       return Promise.reject(error)
    }
)

export default instance;
