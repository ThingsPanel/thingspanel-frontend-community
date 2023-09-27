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

/**
 * 注册租户
 * @returns {AxiosPromise}
 */
export function register(data) {
    return axios({
        url: '/auth/tenant/register',
        method: 'post',
        data
    })
}

/**
 * 租户密码重置
 * @returns {AxiosPromise}
 */
export function passwordReset(data) {
    return axios({
        url: '/auth/change_password',
        method: 'post',
        data
    })
}

/**
 * 发送验证码
 * @returns {AxiosPromise}
 */
export function sendCaptchaCode(data) {
    return axios({
        url: '/auth/captcha',
        method: 'post',
        data
    })
}