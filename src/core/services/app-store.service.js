/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-20 14:58:26
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-21 14:41:05
 * @FilePath: \ThingsPanel-Backend-Vue\src\core\services\app.module.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const STORE_TOKEN_KEY = "store_token";
const STORE_TOKEN_EXPIRED_KEY = "store_expires_in";
const STORE_TOKEN_TYPE_KEY = "store_token_type";
const STORE_TOKEN_USER = "store_token_user"

const setToken = (res) => {
    window.localStorage.setItem(STORE_TOKEN_KEY, res.token);
    window.localStorage.setItem(STORE_TOKEN_EXPIRED_KEY, res.expiresAt);
    window.localStorage.setItem(STORE_TOKEN_TYPE_KEY, res.token_type || "");
    window.localStorage.setItem(STORE_TOKEN_USER, JSON.stringify(res.user) || "{}");
}

const getToken = () => {
    let token = window.localStorage.getItem(STORE_TOKEN_KEY);
    if (!token) {
        return false;
    }
    return token;
}

const getTokenExpired = () => {
    let expired = window.localStorage.getItem(STORE_TOKEN_EXPIRED_KEY);
    return expired;
}

const getUser = () => {
    let user = window.localStorage.getItem(STORE_TOKEN_USER);
    if (user) {
        return JSON.parse(user);
    }
    return {};
}

const clearToken = () => {
    window.localStorage.removeItem(STORE_TOKEN_KEY);
    window.localStorage.removeItem(STORE_TOKEN_EXPIRED_KEY);
    window.localStorage.removeItem(STORE_TOKEN_TYPE_KEY);
    window.localStorage.removeItem(STORE_TOKEN_USER);
}

export default { setToken, getToken, getUser, getTokenExpired, clearToken }