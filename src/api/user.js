import axios from "./http"

// 用户列表
export function user_index(data){
    return axios({
        url: "/user/index",
        method: "post",
        data
    })
}

// 添加用户
export function user_add(data){
    return axios({
        url: "/user/add",
        method: "post",
        data
    })
}

// 修改用户
export function user_edit(data){
    return axios({
        url: "/user/edit",
        method: "post",
        data
    })
}

// 用户权限
export function user_permission(data){
    return axios({
        url: "/user/permission",
        method: "post",
        data,
    })
}

// 重置用户密码
export function user_password(data) {
    return axios({
        url: "/user/password",
        method: "post",
        data
    })
}