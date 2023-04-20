import axios from "./http"

// 数据
export function kv_index(data) {
    return axios({
        url: "v1/soup/data/index",
        method: "post",
        data
    })
}

export function kv_export(data) {
    return axios({
        url: "v1/soup/data/export",
        method: "post",
        data
    })
}