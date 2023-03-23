import axios from "./interceptor/http"

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

// 控制策略列表
export function automation_index(data){
    return axios({
        url: "/automation/index",
        method: "post",
        data
    })
}

/**
 * 通过id获取单条控制策略
 * @param data
 * @returns {AxiosPromise}
 */
export function getOneControlStrategy(data) {
    return axios({
        url: "/automation/details",
        method: "post",
        data
    })
}

// 添加控制策略
export function automation_add(data){
    return axios({
        url: "/automation/add",
        method: "post",
        data,
    })
}

// 修改控制策略
export function automation_edit(data){
    return axios({
        url: "/automation/edit",
        method: "post",
        data,
    })
}

// 删除控制策略
export function automation_delete(data){
    return axios({
        url: "/automation/delete",
        method: "post",
        data,
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

// 控制指令 第三个选项
export function automation_instruct(data){
    return axios({
        url: "/automation/instruct",
        method: "post",
        data,
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

// 删除告警信息
export function warning_delete(data){
    return axios({
        url: "/warning/delete",
        method: "post",
        data
    })
}