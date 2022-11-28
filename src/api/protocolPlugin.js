import axios from "./http"

/**
 * 协议插件API
 */
export default {

    /**
     * 添加插件
     * @param data
     * @returns {AxiosPromise}
     */
    add: (data) => {
        return axios({
            url: "/tp_protocol_plugin/add",
            method: "post",
            data
        })
    },


    /**
     * 删除插件
     * @param data
     * @returns {AxiosPromise}
     */
    del: (data) => {
        return axios({
            url: "/tp_protocol_plugin/delete",
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
            url: "/tp_protocol_plugin/list",
            method: "post",
            data
        })
    }
}