import axios from "./http"

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
}