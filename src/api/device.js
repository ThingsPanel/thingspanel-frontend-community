import axios from "./http"

// 设备分页条件查询
export function device_list(data){
    return axios({
        url: "/device/list",
        method: "post",
        data
    })
}

// 通过 id 查询 设备详情
export function device_data(data){
    return axios({
        url: "/index/show",
        method: "post",
        data
    })
}

// 添加设备
export function device_add(data){
    return axios({
        url: "/device/add_only",
        method: "post",
        data
    })
}

// 更新设备信息
export function device_update(data){
    return axios({
        url: "/device/update_only",
        method: "post",
        data
    })
}

// 删除设备
export function device_delete(data){
    return axios({
        url: "/asset/delete",
        method: "post",
        data: {
            type: 2,
            ...data
        }
    })
}

export function device_default_setting(data){
    return axios({
        url: "/index/default_setting",
        method: "post",
        data,
    })
}