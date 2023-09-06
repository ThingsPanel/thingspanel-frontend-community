import i18n from "@/core/plugins/vue-i18n.js"

/**
 * 插件类型
 */
const PluginType = {
    /**
     * 设备插件
     */
    device: 1,
    /**
     * 协议插件
     */
    protocol: 4,
    /**
     * 解析脚本
     */
    script: 3,
    /**
     * 规则引擎
     */
    nodRed: 2,
    /**
     * 可视化插件
     */
    visual: 5
}
/**
 * 设备插件分类
 */
const DevicePluginType = {
    Sensor: 1,
    Controller: 2,
    Lighting: 3,
    Electricity: 4,
    Camera: 5,
    Other: 6,
    Label: {
        Sensor: i18n.t('PLUGIN.TAB1_CONTENT.CLASSIFY_TYPE.SENSOR'),
        Controller: i18n.t('PLUGIN.TAB1_CONTENT.CLASSIFY_TYPE.CONTROLLER'),
        Lighting: i18n.t('PLUGIN.TAB1_CONTENT.CLASSIFY_TYPE.LIGHTING'),
        Electricity: i18n.t('PLUGIN.TAB1_CONTENT.CLASSIFY_TYPE.ELECTRICITY'),
        Camera: i18n.t('PLUGIN.TAB1_CONTENT.CLASSIFY_TYPE.CAMERA'),
        Other: i18n.t('PLUGIN.TAB1_CONTENT.CLASSIFY_TYPE.OTHER'),
    },
    /**
     * 通过value获取key
     * @param {*} value 
     * @returns 
     */
    getKey: value => String(Object.keys(DevicePluginType).find(key => DevicePluginType[key] === value)),
    /**
     * 通过value或key获取label
     * @param {*} v 
     * @returns 
     */
    getLabel: (v) => {
        if (typeof v === "string") {
            return DevicePluginType.Label[v];
        }
        else if (typeof v === "number") {
            return DevicePluginType.getLabel(DevicePluginType.getKey(v));
        }
    }
    
}

/*
    仓库格式转TP格式：  设备，脚本
    TP格式转仓库格式：  设备，脚本
*/
const Wash = {
    device: {
        fromStore: data => {
            return {
                pluginType: PluginType.Device,
                storeId: data.ID,
                name: data.pluginName,
                jsonData: data.dataResource,
                author: data.pluginAuthor,
                version: data.versionNumber,
                describe: data.pluginDescribe,
                devicePluginType: String(data.devicePluginType),
                devicePluginTypeLabel: DevicePluginType.getLabel(Number(data.devicePluginType)),
            }
        },
        fromTP: data => {
            return {
                pluginType: PluginType.Device,
                id: data.id,
                name: data.model_name,
                jsonData: data.chart_data,
                author: data.author,
                version: data.version,
                describe: data.describe,
                devicePluginType: String(data.model_type),
                devicePluginTypeLabel: DevicePluginType.getLabel(Number(data.model_type)),
            }
        },
        /**
         * 仓库格式转TP格式
         * @param {*} data 
         * @returns 
         */
        storeToTP: data => {
            return {
                model_name: data.pluginName,
                model_type: String(data.devicePluginType),
                chart_data: data.dataResource,
                author: data.pluginAuthor,
                version: data.versionNumber,
                describe: data.pluginDescribe,
                pluginType: DevicePluginType.getLabel(Number(data.devicePluginType)),
                id: data.id
            }
        },
        /**
         * TP格式转仓库格式：
         * @param {*} data 
         * @returns 
         */
        TPToStore: data => {
            return {
                pluginName: data.model_name,
                devicePluginType: Nummber(data.model_type),
                dataResource: data.chart_data,
                pluginAuthor: data.author,
                versionNumber: data.version,
                pluginDescribe: data.describe
            }
        }
    },
    script: {
        /**
         * 
         * @param {*} data 
         * @returns 
         */
        fromStore: data => {
            return {
                pluginType: PluginType.Script,
                storeId: data.ID,
                name: data.scriptName,
                jsonData: data.dataResource,
                author: data. scriptAuthor,
                version: data.versionNumber,
                describe: data.scriptDescribe,
                protocolType: data.protocolType,
                uplinkScript: data.uplinkScript,
                downlinkScript: data.downlinkScript,
                scriptPluginType: String(data.devicePluginType),
                scriptPluginTypeLabel: DevicePluginType.getLabel(Number(data.devicePluginType)),
            }
        },
        /**
         * 
         * @param {*} data 
         * @returns 
         */
        fromTP: data => {
            return {
                pluginType: PluginType.Script,
                id: data.id,
                name: data.script_name,
                jsonData: "{}",
                author: data.company,
                version: "1.0",
                describe: data.remark
            }
        },
    }
}



export { 
    PluginType, 
    DevicePluginType, 
    Wash 
}