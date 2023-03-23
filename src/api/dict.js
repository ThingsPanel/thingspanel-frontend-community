import axios from "./interceptor/http"

/**
 * 字典API
 */
export default {


    /**
     * 列表
     * @param data
     * @returns {AxiosPromise}
     */
    list: (data) => {
        return axios({
            url: "/dict/list/",
            method: "post",
            data
        })
    }
}