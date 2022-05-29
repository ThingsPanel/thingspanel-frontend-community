import axios from "./http"

export function login(data) {
    return axios({
        url: '/auth/login',
        method: 'post',
        data
    })
}

export function logout() {
    return axios({
        url: '/auth/logout',
        method: 'post',
    })
}

export function me() {
    return axios({
        url: '/auth/me',
        method: 'post',
    })
}