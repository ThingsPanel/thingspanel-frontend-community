
/**
 * 插件类型
 */
const PluginType = {
    /**
     * 设备插件
     */
    Device: 1,
    /**
     * 协议插件
     */
    Protocol: 2,
    /**
     * 解析脚本
     */
    Script: 3,
    /**
     * 规则引擎
     */
    NodRed: 4,
    /**
     * 可视化插件
     */
    Visual: 5
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
        Sensor: "传感器",
        Controller: "控制器",
        Lighting: "照明",
        Electricity: "电力",
        Camera: "摄像头",
        Other: "其他",
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
        /*
            {
                "id": "1be2148e-ed44-52c6-3268-d441088579d5",
                "script_name": "温湿度脚本",
                "company": "温湿度脚本",
                "product_name": "温湿度脚本",
                "script_content_a": "func (){\"key\":\"value\"}",
                "script_content_b": "func (){\"key\":\"value\"}",
                "created_at": 1679561375,
                "remark": "描述",
                "device_type": "undefined"
            }
        */
    }
}



export { 
    PluginType, 
    DevicePluginType, 
    Wash 
}