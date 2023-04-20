import axios from "./http"

const BASE_URL = "v1/pot"

/**
 * 锅型API
 */
export default {

    /**
     * 新增或修改
     * @param url  add/edit
     * @param data
     * @returns {AxiosPromise}
     */
    saveOrUpdate: (url, data) => {
        return axios({
            url: BASE_URL +"/"+ url,
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
            url: BASE_URL + "/index",
            method: "post",
            data
        })
    },
    /**
     * 查询分页列表
     * @param data
     * @returns {AxiosPromise}
     */
    getOne: (data) => {
        return axios({
            url: BASE_URL + "/index",
            method: "post",
            data
        })
    }
}