/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-20 15:22:51
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-31 08:52:22
 * @FilePath: \ThingsPanel-Backend-Vue\src\api\store.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import app_axios from "./interceptor/app-store";

export default {

    /**
     * 登录仓库
     * @param {*} data 
     * @returns 
     */   
    login: data => app_axios.post("/base/user_login", data),

    
    get: {
        /**
         * 获取单个设备插件
         * @param {*} data 
         * @returns 
         */
        device: data => app_axios.get("/Web/findTPluginDevice", data),
    },

    list: {
        /**
         * 获取设备插件分页列表
         * @param {*} data 
         * @returns 
         */
        device: data => {
            return app_axios({
                method: 'get',
                url: '/Web/getTPluginDeviceList',
                params: data
            })
        },
        /**
         * 获取协议插件分页列表
         * @param {*} data 
         * @returns 
         */
        script: data => {
            return app_axios({
                method: 'get',
                url: '/Web/getTProtocolScriptList',
                params: data
            })
        },
        /**
         * 获取规则引擎分页列表
         * @param {*} data 
         * @returns 
         */
        nodeRed: data => {
            return app_axios({
                method: 'get',
                url: '/Web/getTRuleEngineList',
                params: data
            })
        },
    },

    
    publish: {

        /**
         * 发布设备插件
         * @param {*} data 
         * @returns 
         */
        device: data => app_axios.post("/WebUser/createTPluginDevice", data),

        /**
         * 发布协议脚本
         * @param {*} data 
         * @returns 
         */
        script: data => app_axios.post("/WebUser/createTProtocolScript", data),
    }
}