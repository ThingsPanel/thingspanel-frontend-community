import DictAPI from "@/api/dict.js"
import ProtocolAPI from "@/api/protocolPlugin.js"

export default function useDeviceSettingIndex() {

    /**
     * 获取设备传输协议列表
     */
    async function getDeviceProtocolList() {
        let result = await getProtocolList("DRIECT_ATTACHED_PROTOCOL");
        result.unshift({ value: "mqtt", label: "官方MQTT协议" })
        result.push({ value: "ezviz", label: "萤石云视频协议" })
        return result;
    }

    /**
     * 获取网关传输协议下拉列表
     */
    async function getGatewayProtocolList() {
        let result = await getProtocolList("GATEWAY_PROTOCOL");
        return result;
    }

    /**
     * 获取自定义协议连接信息
     * @param deviceData
     * @returns {Promise<[{label: string, value: string}, {label: string, value: (string|[{message: *, required: boolean}]|[{message: string, required: boolean}]|*)}]|*[]>}
     */
    async function getCustomConnectInformation(deviceData) {

        let params = {current_page: 1, per_page: 10, protocol_type: deviceData.protocol, device_type: deviceData.device_type };
        let { data } = await ProtocolAPI.page(params)
        if (data.code == 200) {
            console.log("====getDefaultSetting.getCustomConnectInformation", data.data.data)
            if (!data.data.data) return [];
            let result = data.data.data[0];
            let port = result.access_address.split(":")[1];
            let description = result.description ? result.description : "";
            let additionalInfo = result.additional_info ? JSON.parse(result.additional_info) : [];
            if (additionalInfo.length > 0) {
                return additionalInfo.map(item => {
                    return { label: item.key, value: item.value }
                })
            } else {
                return [
                    { label: "协议端口", value: port },
                    { label: "描述", value: description }
                ]
            }
        }
    }

    return {
        getDeviceProtocolList,
        getGatewayProtocolList,
        getCustomConnectInformation
    }
}

/**
 * 获取传输协议列表
 * @param dict_code
 * @returns {Promise<unknown>}
 */
const getProtocolList = (dict_code) => {
    return new Promise((resolve, reject) => {
        let params = { current_page: 1, per_page: 9999, dict_code}
        DictAPI.list(params)
            .then(({data}) => {
                if (data.code == 200) {
                    let result = data.data.data.map(item => {
                        return { label: item.describe, value: item.dict_value }
                    } );
                    resolve(result);
                } else {
                    reject(data);
                }
            })
    })
}
