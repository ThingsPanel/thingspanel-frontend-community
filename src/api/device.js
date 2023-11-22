import axios from "./interceptor/http"

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
        url: "/device/delete",
        method: "post",
        data
    })
}

/**
 * 根据id获取设备信息
 * @param data
 * @returns {AxiosPromise}
 */
export function device_info(data) {
    return axios({
        url: "/device/data",
        method: "post",
        data
    })
}

// 设备的默认参数
export function device_default_setting(data){
    return axios({
        url: "/index/default_setting",
        method: "post",
        data,
    })
}

// api/structure/field
// data: {
//     field: "switch" switch 是插件名
// }
export function structure_field(data){
    return axios({
        url: "/structure/field",
        method: "post",
        data,
    })
}

/* 添加映射
data 里是数组 有 id 为修改，没有id新建
[
  {
    device_id: "7ee0a151-dc85-ca78-d219-2d58579fa6cb"
    field_from: "12123123" // 自定义
    field_to: "status"
    id: "f229ff5a-755b-8243-ab72-13422f3b03a2"
  }
]
 */
export function field_add(data){
    return axios({
        url: "/field/add_only",
        method: "post",
        data,
    })
}

export function structure_delete(data){
    return axios({
        url: "/structure/delete",
        method: "post",
        data,
    })
}

// 根据设备id获取字段映射
export function device_field_index(data){
    return axios({
        url: "/field/device/index",
        method: "post",
        data,
    })
}


/**
 * 根据属性获取设备的数据
 * @param data
 * @returns {AxiosPromise}
 */
export function currentValue(data) {
    return axios({
        url: "/kv/current",
        method: "post",
        data,
    })
}


/**
 * 根据属性获取设备属性的详情
 * @param data
 * @returns {AxiosPromise}
 */
export function currentValueDetail(data) {
    return axios({
        url: "/kv/current/detail",
        method: "post",
        data,
    })
}

/**
 * 根据属性获取设备的历史数据
 * @param data
 * @returns {AxiosPromise}
 */
export function historyValue(data) {
    return axios({
        url: "/kv/history",
        method: "post",
        data,
    })
}

/**
 * 根据属性获取设备的历史数据
 * @param data
 * @returns {AxiosPromise}
 */
export function historyValueByKey(data) {
    return axios({
        url: "/kv/history/key",
        method: "post",
        data,
    })
}

/**
 * 根据属性获取设备的历史数据，带分页、导出
 * @param data
 * @returns {AxiosPromise}
 */
export function historyValueData(data) {
    return axios({
        url: "/kv/history/data",
        method: "post",
        data,
    })
}

/**
 * 根据属性获取设备的统计数据
 * @param data
 * @returns {AxiosPromise}
 */
export function statistic(data) {
    return axios({
        url: "/kv/statistic",
        method: "post",
        data,
    })
}

/**
 * 批量获取历史统计数据
 * @param {*} data 
 * @returns 
 */
export function statisticBatch(data) {
    return axios({
        url: "/kv/statistic/batch",
        method: "post",
        data,
    })
}


/**
 * 控制开关
 * @param data
 * @returns {AxiosPromise}
 */
export function turnSwitch(data) {
    return axios({
        url: "/device/operating_device",
        method: "post",
        data,
    })
}

/**
 * 获取设备列表（含网关和设备)
 * @param data
 */
export function getDeviceTree(data) {
    return axios({
        url: "/device/list/tree",
        method: "post",
        data,
    })
}

export function getProjectGroup(data) {
    return axios({
        url: "/device/business/asset",
        method: "post",
        data,
    })
}


/**
 * 获取设备信息
 * @param data
 * @returns {AxiosPromise}
 */
export function getDeviceInfo(data) {
    return axios({
        url: "/device/data",
        method: "post",
        data,
    })
}

/**
 * 更新设备信息
 * @param data
 * @returns {AxiosPromise}
 */
export function updateDeviceInfo(data){
    return axios({
        url: "/device/update_only",
        method: "post",
        data
    })
}


/**
 * 获取自定义数据交换列表
 * @param data
 * @returns {AxiosPromise}
 */
export function getCustomExchangeAgreementList(data){
    return axios({
        url: "/tp_script/list",
        method: "post",
        data
    })
}

/**
 * 新增自定义数据交换格式
 * @param data
 * @returns {AxiosPromise}
 */
export function addCustomExchangeAgreement(data){
    return axios({
        url: "/tp_script/add",
        method: "post",
        data
    })
}

/**
 * 编辑自定义数据交换格式
 * @param data
 * @returns {AxiosPromise}
 */
export function editCustomExchangeAgreement(data){
    return axios({
        url: "/tp_script/edit",
        method: "post",
        data
    })
}

/**
 * 删除自定义数据交换格式
 * @param data
 * @returns {AxiosPromise}
 */
export function deleteCustomExchangeAgreement(data){
    return axios({
        url: "/tp_script/delete",
        method: "post",
        data
    })
}

export function testScript(data){
    return axios({
        url: "/tp_script/quiz",
        method: "post",
        data
    })
}

/**
 * 获取多个设备状态
 * @param data   设备列表
 * @returns {AxiosPromise}
 */
export function getDeviceListStatus(data) {
    return axios({
        url: "/device/status",
        method: "post",
        data,
    })
}

/**
 * 根据设备id获取设备的历史命令
 * @param {*} data 
 * @returns 
 */
export function getDeviceCommandHistoryList(data) {
    return axios({
        url: "/device/command/history/list",
        method: "post",
        data,
    })
}

/**
 * 根据设备id获取设备的命令列表
 * @param {*} data 
 * @returns 
 */
export function getDeviceCommandList(data) {
    return axios({
        url: "/device/command/list",
        method: "post",
        data,
    })
}

/**
 * 通过设备id发送命令
 * @param {*} data 
 * @returns 
 */
export function sendCommandByDeviceId(data) {
    return axios({
        url: "/device/command/send",
        method: "post",
        data,
    })
}

/**
 * 根据设备id获取设备的历史事件
 * @param {*} data 
 * @returns 
 */
export function getDeviceEventHistoryList(data) {
    return axios({
        url: "/device/event/history/list",
        method: "post",
        data,
    })
}

/**
 * 根据设备属性删除历史数据
 * @param {*} data 
 * @returns 
 */
export function delHistoryData(data) {
    return axios({
        url: "/kv/history/delete",
        method: "post",
        data,
    })
}


/**
 * 获取系统时间
 * @returns 
 */
export function getSystemTime() {
    return axios({
        url: "/home/system/time",
        method: "post",
    })
}

/**
 * @description: 获取设备在线/离线总数
 * @return {*}
 */
export function getDeviceStatusCount(data) {
    return axios({
        url: "/device/tenant/count",
        method: "post",
        data
    })
}

/**
 * @description: 手动设置设备在线/离线状态
 * @param {*} data
 * @return {*}
 */
export function setDeviceStatus(data) {
    return axios({
        url: "/device/online/status",
        method: "post",
        data
    })
}
