import axios from "./http"

/**
 * 可视化API
 */
export default {

    /**
     * 添加可视化大屏
     * @param data
     * @returns {AxiosPromise}
     */
    add: (data) => {
        return axios({
            url: "/tp_dashboard/add",
            method: "post",
            data
        })
    },

    /**
     * 可视化大屏列表
     * @param data
     * {
            "current_page": 1,
            "per_page": 10,
            "relation_id": "123456"
        }
     * @returns {AxiosPromise}
     */
    list: (data) => {
        return axios({
            url: "/tp_dashboard/list",
            method: "post",
            data
        })
    },

    /**
     * 修改可视化大屏
     * @param data
     * @returns {AxiosPromise}
     */
    edit: (data) => {
        return axios({
            url: "/tp_dashboard/edit",
            method: "post",
            data
        })
    },

    /**
     * 删除可视化大屏
     * @param data
     * @returns {AxiosPromise}
     */
    del: (data) => {
        return axios({
            url: "/tp_dashboard/delete",
            method: "post",
            data
        })
    },


}