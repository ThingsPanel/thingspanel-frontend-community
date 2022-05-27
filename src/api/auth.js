import axios from "./http"

export function login(data) {
    return axios({
        url: '/api/auth/login',
        method: 'post',
        data
    })
}

export function logout() {
    return axios({
        url: '/api/auth/logout',
        method: 'post',
    })
}

export function me() {
    return axios({
        url: '/api/auth/me',
        method: 'post',
    })
}