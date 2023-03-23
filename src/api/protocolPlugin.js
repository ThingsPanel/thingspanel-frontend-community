import axios from "./interceptor/http"

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
    },

    /**
     * WVP获取设备列表
     * @param data
     * @returns {AxiosPromise}
     */
    getWVPDevices: (data) => {
        return axios({
            url: "/wvp/query/devices",
            method: "post",
            data
        })
    },

    /**
     * 允许播放WVP
     * @param data
     * @returns {AxiosPromise}
     */
    callPlayWVP: (data) => {
        return axios({
            url: "/wvp/play/start/",
            method: "post",
            data
        })
    },

    /**
     * PTZ控制
     * @param data
     * @returns {AxiosPromise}
     */
    commandPlayerPTZ: (data) => {
        return axios({
            url: "/wvp/ptz",
            method: "post",
            data
        })
    },

    /**
     * 获取录像列表
     * @param data
     * @returns {AxiosPromise}
     */
    getRecordList: (data) => {
        return axios({
            url: "/gb_record/query",
            method: "post",
            data
        })
    },

    /**
     * 获取录像地址
     * @param data
     * @returns {AxiosPromise}
     */
    getRecordURL: (data) => {
        return axios({
            url: "/playback/start",
            method: "post",
            data
        })
    },

    /**
     * 停止播放录像
     * @param data
     * @returns {AxiosPromise}
     */
    stopRecordPlay: (data) => {
        return axios({
            url: "/wvp/play/stop",
            method: "post",
            data
        })
    },
}