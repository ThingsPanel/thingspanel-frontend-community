import axios from "./interceptor/http"

// 数据
export function kv_index(data) {
    return axios({
        url: "/kv/index",
        method: "post",
        data
    })
}

export function kv_export(data) {
    return axios({
        url: "/kv/export",
        method: "post",
        data
    })
}