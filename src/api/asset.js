/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-29 14:11:24
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-20 15:07:36
 * @FilePath: \ThingsPanel-Backend-Vue\src\api\asset.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from "./interceptor/http"

// 设备插件
export function asset_index(){
    return axios({
        url: "/asset/index",
        method: "post",
    })
}

// 设备插件的仪表
export function structure_field(data){
    return axios({
        url: "/structure/field",
        method: "post",
        data // {field: "business"}
    })
}

// 资产
export function asset_list(data) {
    return axios({
        url: "/asset/list",
        method: "post",
        data,
    })
}

// 根据业务id获取设备分组
export function asset_list_a(data) {
    return axios({
        url: "/asset/list/a",
        method: "post",
        data,
    })
}

// 根据设备分组ID查询子设备分组
export function asset_list_b(data) {
    return axios({
        url: "/asset/list/b",
        method: "post",
        data,
    })
}

// 设备分组下拉菜单 {business_id}
export function device_group_drop(data){
    const trim = (v) => {
        if (!v) return v;
        if (v.startsWith("/")) {
            return v.substring(1);
        }
        return v;
    };
    return new Promise((resolve, reject) => {
        axios({ url: "/asset/list/d",method: "post",data })
            .then(res => {
                let arr = res.data.data.map(item => {
                    item.device_group = trim(item.device_group)
                    return item;
                }) 
                res.data.data = arr;
                resolve(res);
            })
            .catch(err => {
                reject(err);
            })
    })
}

// 根据业务id查询所有分组
export function asset_list_c(data){
    return axios({
        url: "/asset/list/c",
        method: "post",
        data,
    })
}

// 更新分组
export function asset_update(data){
    return axios({
        url: "/asset/update_only",
        method: "post",
        data,
    })
}

// 添加分组
export function asset_add(data){
    return axios({
        url: "/asset/add_only",
        method: "post",
        data,
    })
}

// 删除分组
export function asset_delete(data){
    return axios({
        url: "/asset/delete",
        method: "post",
        data:{
            type:1,
            ...data
        },
    })
}