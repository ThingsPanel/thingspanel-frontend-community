import axios from "./http"

// 设备插件
export function asset_index(){
    return axios({
        url: "/asset/index",
        method: "post",
    })
}

// 资产
export function asset_list(data) {
    return axios({
        url: "/asset/list",
        method: "post",
        data,
    })
}

// 根据业务id获取设备分组
export function asset_list_a(data) {
    return axios({
        url: "/asset/list/a",
        method: "post",
        data,
    })
}

// 根据设备分组ID查询子设备分组
export function asset_list_b(data) {
    return axios({
        url: "/asset/list/b",
        method: "post",
        data,
    })
}