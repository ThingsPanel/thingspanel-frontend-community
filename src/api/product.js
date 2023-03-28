import axios from "./interceptor/http"
import { local_url } from "@/api/LocalUrl"

const BASE_URL = "/tp_product"
const BATCH_BASE_URL = "/tp_batch"

/**
 * 产品API
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
     * 修改
     * @param data
     * @returns {AxiosPromise}
     */
    edit: (data) => {
        return axios({
            url: BASE_URL + "/edit",
            method: "post",
            data
        })
    },

    /**
     * 删除
     * @param data
     * @returns {AxiosPromise}
     */
    del: (data) => {
        return axios({
            url: BASE_URL + "/delete",
            method: "post",
            data
        })
    },

    /**
     * 查询分页列表
     * @param data
     * @returns {AxiosPromise}
     */
    page: (data) => {
        return axios({
            url: BASE_URL + "/list",
            method: "post",
            data
        })
    },

    /**
     * 添加
     * @param data
     * @returns {AxiosPromise}
     */
    batchAdd: (data) => {
        return axios({
            url: BATCH_BASE_URL + "/add",
            method: "post",
            data
        })
    },

    /**
     * 修改
     * @param data
     * @returns {AxiosPromise}
     */
    batchEdit: (data) => {
        return axios({
            url: BATCH_BASE_URL + "/edit",
            method: "post",
            data
        })
    },

    /**
     * 删除
     * @param data
     * @returns {AxiosPromise}
     */
    batchDel: (data) => {
        return axios({
            url: BATCH_BASE_URL + "/delete",
            method: "post",
            data
        })
    },

    /**
     * 查询分页列表
     * @param data
     * @returns {AxiosPromise}
     */
    batchPage: (data) => {
        return axios({
            url: BATCH_BASE_URL + "/list",
            method: "post",
            data
        })
    },

    /**
     * 生成批次
     * @param data
     * @returns {AxiosPromise}
     */
    generateBatch: (data) => {
        return axios({
            url: BATCH_BASE_URL + "/generate",
            method: "post",
            data
        })
    },

    uploadUrl: local_url + "api/file/up",

    /**
     * 导入批次
     * @param {*} data 
     * @returns 
     */
    importBatch: data => {
        return axios({
            url: BATCH_BASE_URL + "/import",
            method: "post",
            data
        })
    },

    /**
     * 导出二维码和数据
     * @param data
     * @returns {AxiosPromise}
     */
    exportQRCodeAndData: (data) => {
        return axios({
            url: BATCH_BASE_URL + "/export",
            method: "post",
            data
        })
    },

    /**
     * 获取预注册分页列表
     * @param {*} data 
     * @returns 
     */
    getPreRegistration: data => {
        return axios({
            url: "/tp_generate_device/list",
            method: "post",
            data
        })
    },

    /**
     * 激活设备
     * @param {*} data
     * @returns
     */
    generateDevice: data => {
        return axios({
            url: "/tp_generate_device/activate",
            method: "post",
            data
        })
    },
    
    /**
     * 删除未激活预注册设备
     * @param {*} data 
     * @returns 
     */
    deletePreRegistration: data => {
        return axios({
            url: "/tp_generate_device/delete",
            method: "post",
            data
        })
    },

    
    /**
     * 通过产品id获取设备列表
     * @param data
     * @returns {AxiosPromise}
     */
    getDeviceListByProductId: (data) => {
        return axios({
            url: "/device/listbyproduct",
            method: "post",
            data
        })
    },

    /**
     * 添加固件升级任务
     * @param {*} data 
     * @returns 
     */
    addTask: data => {
        return axios({
            url: "/tp_ota_task/add",
            method: "post",
            data
        })
    }
}