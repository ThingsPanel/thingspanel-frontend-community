import axios from "./interceptor/http"

/**
 * 看板API
 */
export default {

    /**
     * 看板列表
     * @param data
     * @returns {AxiosPromise}
     */
    list: (data) => {
        return axios({
            url: "/console/list",
            method: "post",
            data
        })
    },

    /**
     * 获取看板
     * @param data
     * @returns {AxiosPromise}
     */
    get: (data) => {
        return axios({
            url: "/console/detail",
            method: "post",
            data
        })
    },

    /**
     * 新增看板
     * @param data
     * @returns {AxiosPromise}
     */
    add: (data) => {
        return axios({
            url: "/console/add",
            method: "post",
            data
        })
    },

    /**
     * 编辑看板
     * @param data
     * @returns {AxiosPromise}
     */
    edit: (data) => {
        return axios({
            url: "/console/edit",
            method: "post",
            data
        })
    },

    /**
     * 删除看板
     * @param data
     * @returns {AxiosPromise}
     */
    delete: (data) => {
        return axios({
            url: "/console/delete",
            method: "post",
            data
        })
    },

    /**
     * 生成分享id
     * @param data
     * @returns {AxiosPromise}
     */
    generateShareID: (data) => {
        return axios({
            url: "/share/generate",
            method: "post",
            data
        })
    },

    /**
     * 根据分享id请求看板数据
     * @param data
     * @returns {AxiosPromise}
     */
    getInfoByShareID: (data) => {
        return axios({
            url: "/share/get",
            method: "post",
            data
        })
    },
}