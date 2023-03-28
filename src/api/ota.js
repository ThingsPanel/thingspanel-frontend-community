/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-17 14:50:16
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-27 14:44:50
 * @FilePath: \ThingsPanel-Backend-Vue\src\api\ota.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-17 14:50:16
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-17 20:55:05
 * @FilePath: \ThingsPanel-Backend-Vue\src\api\ota.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from "./interceptor/http"
import { local_url } from "@/api/LocalUrl"

const BASE_URL = "/tp_ota"
const TASK_BASE_URL = "/tp_ota_task"
const TASK_DETAIL_BASE_URL = "/tp_ota_device"

/**
 * 固件API
 */
export default {

    /**
     * 添加
     * @param data
     * @returns {AxiosPromise}
     */
    add: (data) => {
        return axios({
            url: BASE_URL + "/add",
            method: "post",
            data
        })
    },

    /**
     * @description: 列表
     * @return {*}
     */    
    list: (data) => {
        return axios({
            url: BASE_URL + "/list",
            method: "post",
            data
        })
    },

    /**
     * @description: 删除
     * @return {*}
     */    
    delete: (data) => {
        return axios({
            url: BASE_URL + "/delete",
            method: "post",
            data
        })
    },

    /**
     * @description: 上传升级包
     * @return {*}
     */    
    uploadUrl: local_url + "api/file/up",

    /**
     * @description: 固件任务列表
     * @return {*}
     */    
    taskList: (data) => {
        return axios({
            url: TASK_BASE_URL + "/list",
            method: "post",
            data
        })
    },

    /**
     * @description: 添加固件任务
     * @return {*}
     */    
    taskAdd: (data) => {
        return axios({
            url: TASK_BASE_URL + "/add",
            method: "post",
            data
        })
    },

    /**
     * @description: 固件升级任务详情
     * @return {*}
     */    
    taskDetailList: (data) => {
        return axios({
            url: TASK_DETAIL_BASE_URL + "/list",
            method: "post",
            data
        })
    },

    /**
     * @description: 修改升级状态
     * @return {*}
     */    
    modifyUpgradeStatus: data => {
        return axios({
            url: "/tp_ota_device/modfiyupdate",
            method: "post",
            data
        })
    }

}