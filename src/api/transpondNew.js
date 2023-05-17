import axios from "./interceptor/http"

// 数据转发（新）列表
export function getTranspondNewList(data) {
    return axios({
        url: "/tp_data/transpond/list",
        method: "post",
        data
    })
}
// 数据转发（新）新建
export function getTranspondNewAdd(data) {
    return axios({
        url: "/tp_data/transpond/add",
        method: "post",
        data
    })
}


// 数据转发（新）编辑
export function getTranspondNewEdit(data) {
    return axios({
        url: "/tp_data/transpond/edit",
        method: "post",
        data
    })
}


// 数据转发（新）详情
export function getTranspondNewDetail(data) {
    return axios({
        url: "/tp_data/transpond/detail",
        method: "post",
        data
    })
}


// 数据转发（新）删除
export function getTranspondNewDelete(data) {
    return axios({
        url: "/tp_data/transpond/delete",
        method: "post",
        data
    })
}


// 数据转发（新） 状态更改
export function getTranspondNewStatus(data) {
    return axios({
        url: "/tp_data/transpond/switch",
        method: "post",
        data
    })
}




