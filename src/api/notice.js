import axios from "./interceptor/http"

// 通知组列表
export function getNotificationList(data) {
    return axios({
        url: "/notification/list",
        method: "post",
        data
    })
}
// 数据转发（新）新建
export function getNotificationAdd(data) {
    return axios({
        url: "/notification/save",
        method: "post",
        data
    })
}


// 数据转发（新）编辑
export function getNotificationEdit(data) {
    return axios({
        url: "/notification/save",
        method: "post",
        data
    })
}


// 数据转发（新）详情
export function getNotificationDetail(data) {
    return axios({
        url: "/notification/detail",
        method: "post",
        data
    })
}


// 数据转发（新）删除
export function getNotificationDelete(data) {
    return axios({
        url: "/notification/delete",
        method: "post",
        data
    })
}


// 获取用户列表
export function getUserList(data) {
    return axios({
        url: "/user/index",
        method: "post",
        data
    })
}

