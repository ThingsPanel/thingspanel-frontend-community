import axios from "./http"

// 设备插件
export function asset_index(){
    return axios({
        url: "/asset/index",
        method: "post",
    })
}

// 设备插件的仪表
export function structure_field(data){
    return axios({
        url: "/structure/field",
        method: "post",
        data // {field: "business"}
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

// 设备租下拉菜单 {business_id}
export function device_group_drop(data){
    return axios({
        url: "/asset/list/d",
        method: "post",
        data,
    })
}

// 根据业务id查询所有分组
export function asset_list_c(data){
    return axios({
        url: "/asset/list/c",
        method: "post",
        data,
    })
}

// 更新分组
export function asset_update(data){
    return axios({
        url: "/asset/update_only",
        method: "post",
        data,
    })
}