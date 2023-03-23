import axios from "./interceptor/http"

/**
 * 网关(modbus)接口
 */
export default {

    /**
     * 获取设备配置的表单属性
     * @param data
     * @returns {AxiosPromise}
     */
    getFormAttr: (data) => {
        return axios({
            url: "/form/config",
            method: "post",
            data
        })
    },

    /**
     * 更新子设备配置
     * @param data
     * @returns {AxiosPromise}
     */
    updateDeviceConfig: (data) => {
        return axios({
            url: "/device/update_only",
            method: "post",
            data
        })
    },


}