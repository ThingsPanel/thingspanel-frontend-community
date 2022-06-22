import axios from "./http"

// 自动化的列表
export function work_index(data){
    return axios({
        url: "/asset/work_index",
        method: "post",
        data
    })
}

// 告警策略列表
export function warning_show(data){
    return axios({
        url: "/warning/show",
        method: "post",
        data
    })
}

// 设备下拉选择
export function dashboard_device(data) {
    return axios({
        url: "/dashboard/device",
        method: "post",
        data
    })
}

// 触发条件 如：开关状态
export function automation_show(data){
    return axios({
        url: "/automation/show",
        method: "post",
        data
    })
}

// 符号 如：大于小于等于
export function automation_symbol(){
    return axios({
        url: "/automation/symbol",
        method: "post",
    })
}

// 新增告警信息
export function warning_add(data){
    return axios({
        url: "/warning/add",
        method: "post",
        data
    })
}

// 编辑告警信息
export function warning_edit(data){
    return axios({
        url: "/warning/edit",
        method: "post",
        data,
    })
}