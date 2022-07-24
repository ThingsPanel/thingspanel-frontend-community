import red_axios, {red_url} from "@/api/red-axios";
import axios from './http'

var loginData = {
    "client_id": "node-red-editor",
    "grant_type": "password",
    "scope": "*",
    "username": "admin",
    "password": "admin"
}

/**
 * 获取thingspabel的数据转发列表
 * @param data
 * @returns {AxiosPromise}
 */
export function getTranspondList(data) {
    return axios(({
        url: '/data/transpond/list',
        method: 'post',
        data
    }))
}

/**
 * 向thingspanel添加数据转发规则
 * @param data
 * @returns {AxiosPromise}
 */
export function addTranspond(data) {
    return axios(({
        url: '/data/transpond/add',
        method: 'post',
        data
    }))
}

export function delTranspond(data) {
    return axios(({
        url: '/data/transpond/delete',
        method: 'post',
        data
    }))
}



/**
 * 获取node-red的认证schame
 * @param data
 * @returns {*}
 */
export function getRedLogin(data) {
    return red_axios({
        url: '/auth/login',
        method: 'get',
        data
    })
}

/**
 * 获取node-red认证后的token
 * @returns {*}
 */
export function getRedToken() {
    return red_axios({
        url: '/auth/token',
        method: 'post',
        data: loginData
    })
}

/**
 * 新增flow
 * @param data
 * @returns {AxiosPromise}
 */
export function addFlow(data) {
    return red_axios({
        url: '/flow',
        method: 'post',
        data
    })
}

/**
 * 获取所有flow
 * @param data
 * @returns {AxiosPromise}
 */
export function getFlows(data) {
    return red_axios({
        url: '/flows',
        method: 'get',
        data
    })
}

/**
 * 更新所有flow
 * @param data
 * @returns {AxiosPromise}
 */
export function updateFlows(data) {
    return red_axios({
        url: '/flows',
        method: 'post',
        data
    })
}

/**
 * 删除flow
 * @param data
 * @returns {AxiosPromise}
 */
export function delFlow(data) {
    return red_axios(({
        url: '/flow',
        method: 'delete',
        data
    }))
}

export function getRedUrl(id) {
    return red_url + "/#flow/" + id;
}