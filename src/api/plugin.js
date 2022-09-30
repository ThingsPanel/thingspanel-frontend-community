import axios from "./http"

/**
 * 插件API
 */
export default {

    /**
     * 添加插件
     * @param data
     * @returns {AxiosPromise}
     */
    add: (data) => {
        return axios({
            url: "/device/model/add",
            method: "post",
            data
        })
    },

    /**
     * 查询插件分页列表
     * @param data
     * @returns {AxiosPromise}
     */
    page: (data) => {
        return axios({
            url: "/device/model/list",
            method: "post",
            data
        })
    },

    /**
     * 查询插件树
     * @param data
     * @returns {AxiosPromise}
     */
    tree: (data) => {
        return axios({
            url: "/device/model/tree",
            method: "post",
            data
        })
    },

    /**
     * 插件分类列表
     * @param data
     * @returns {AxiosPromise}
     */
    category: (data) => {
        return axios({
            url: "/dict/list/",
            method: "post",
            data
        })
    }
}