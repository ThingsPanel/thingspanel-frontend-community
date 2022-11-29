import DictAPI from "@/api/dict.js"

export default function useDeviceSettingIndex() {

    /**
     * 获取设备传输协议列表
     */
    async function getDeviceProtocolList() {
        let result = await getProtocolList("DRIECT_ATTACHED_PROTOCOL");
        return result;
    }

    /**
     * 获取网关传输协议下拉列表
     */
    async function getGatewayProtocolList() {
        let result = await getProtocolList("GATEWAY_PROTOCOL");
        return result;
    }

    return {
        getDeviceProtocolList,
        getGatewayProtocolList
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