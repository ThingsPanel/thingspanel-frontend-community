/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-29 14:11:24
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-20 15:27:50
 * @FilePath: \ThingsPanel-Backend-Vue\src\api\transpond.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import red_axios from "./interceptor/red-axios";
import axios from './interceptor/http'
import { red_url } from "@/api/LocalUrl"

const loginData = {
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

/**
 * 更新thingspanel中的数据
 * @param data
 * @returns {AxiosPromise}
 */
export function updateTranspond(data) {
    return axios(({
        url: '/data/transpond/edit',
        method: 'post',
        data
    }))
}

/**
 * 删除数据转发规则
 * @param data
 * @returns {AxiosPromise}
 */
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
 * 获取flow
 * @param id
 * @returns {AxiosPromise}
 */
export function getFlow(id) {
    return red_axios({
        url: '/flow/' + id,
        method: 'get'
    })
}


export function updateFlow(id, data) {
    return red_axios({
        url: '/flow/' + id,
        method: 'put',
        data
    })
}

/**
 * 删除flow
 * @param data
 * @returns {AxiosPromise}
 */
export function delFlow(id) {
    return red_axios({
        url: '/flow/' + id,
        method: 'delete'
    })
}

/**
 * 启动流程
 * @param data
 * @returns {AxiosPromise}
 */
export function startFlow(data) {
    return red_axios({
        url: '/startFlow',
        method: 'post',
        data
    })
}

/**
 * 停止流程
 * @param data
 * @returns {AxiosPromise}
 */
export function stopFlow(data) {
    return red_axios({
        url: '/stopFlow',
        method: 'post',
        data
    })
}

/**
 * 获取所有flow
 * @returns {AxiosPromise}
 */
export function getFlows() {
    return red_axios({
        url: '/flows',
        method: 'get',
        headers: {
            "Node-RED-API-Version": "v2"
        }
    })
}

/**
 * 更新所有flow
 * @param data
 * @returns {AxiosPromise}
 */
export function updateFlows(data) {
    return red_axios.post(
        '/flows',
        data,
        {
            headers: {
                "Node-RED-API-Version": "v2",
                "Node-RED-Deployment-Type": "flows",
                "Content-type": "application/json"
            }
        }
    );
}



export function getRedUrl(id) {
    return red_url + "#flow/" + id;
}