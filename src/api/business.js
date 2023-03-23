import axios from "./interceptor/http";

// 业务列表
export function business_index(data) {
    return axios({
        url: "/business/index",
        method: "post",
        data
    })
}

// 新建业务
export function business_add(data) {
    return axios({
        url: "/business/add",
        method: "post",
        data
    })
}

// 业务修改
export function business_edit(data) {
    return axios({
        url: "/business/edit",
        method: "post",
        data
    })
}

// 删除业务
export function business_delete(data){
    return axios({
        url: "/business/delete",
        method: "post",
        data
    })
}