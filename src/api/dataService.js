import axios from "./interceptor/http"

// 数据服务配置列表
export function getList(data) {
    return axios({
        url: "/tp_data_services_config/list",
        method: "post",
        data
    })
}
// 数据服务配置新建
export function getAdd(data) {
    return axios({
        url: "/tp_data_services_config/add",
        method: "post",
        data
    })
}


// 数据服务配置编辑
export function getEdit(data) {
    return axios({
        url: "/tp_data_services_config/edit",
        method: "post",
        data
    })
}

// 数据服务配置删除
export function getDelete(data) {
    return axios({
        url: "/tp_data_services_config/del",
        method: "post",
        data
    })
}

// 调试数据
export function getSet(data) {
    return axios({
        url: "/tp_data_services_config/quize",
        method: "post",
        data
    })
}

// 通知组状态开关
export function getStatus(data) {
    return axios({
        url: "/notification/switch",
        method: "post",
        data
    })
}

// 获取sql下拉列表
export function getSqlList(data) {
    return axios({
        url: "/tp_data_services_config/tptable",
        method: "post",
        data
    })
}
// 获取sql表格列表
export function getSqlTabelList(data) {
    return axios({
        url: "/tp_data_services_config/tptablefield",
        method: "post",
        data
    })
}
