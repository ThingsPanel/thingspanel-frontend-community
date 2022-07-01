import axios from "./http"

// 用户列表
export function user_index(data) {
    return axios({
        url: "/user/index",
        method: "post",
        data
    })
}

// 添加用户
export function user_add(data) {
    return axios({
        url: "/user/add",
        method: "post",
        data
    })
}

// 修改用户
export function user_edit(data) {
    return axios({
        url: "/user/edit",
        method: "post",
        data
    })
}

// 删除用户
export function user_delete(data) {
    return axios({
        url: "/user/delete",
        method: "post",
        data
    })
}

// 用户权限
export function user_permission(data) {
    return axios({
        url: "/user/permission",
        method: "post",
        data,
    })
}

// 重置用户密码
export function user_reset_password(data) {
    return axios({
        url: "/user/password",
        method: "post",
        data
    })
}

// 修改密码
export function user_change_password(data) {
    return axios({
        url: "/user/update",
        method: "post",
        data
    })
}


// 修改密码
export async function get_menu(data) {
    console.log('--data--', data);
    return axios({
        url: "/menu/user",
        method: "post",
        data
    })
}