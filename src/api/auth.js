import axios from "./interceptor/http"

/**
 * 登录
 * @param data
 * @returns {AxiosPromise}
 */
export function login(data) {
    return axios({
        url: '/auth/login',
        method: 'post',
        data
    })
}

/**
 * 退出登录
 * @returns {AxiosPromise}
 */
export function logout() {
    return axios({
        url: '/auth/logout',
        method: 'post',
    })
}

/**
 * 获取当前用户信息
 * @returns {AxiosPromise}
 */
export function getUserInfo() {
    return axios({
        url: '/auth/me',
        method: 'post',
    })
}