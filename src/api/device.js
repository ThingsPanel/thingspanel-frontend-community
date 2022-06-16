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