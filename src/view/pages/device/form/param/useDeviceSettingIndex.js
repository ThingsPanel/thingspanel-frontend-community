import DictAPI from "@/api/dict.js"
import {ref} from "@vue/composition-api";
export default function useDeviceSettingIndex() {

    /**
     * 获取设备传输协议列表
     */
    function getDeviceProtocolList() {
        return new Promise((resolve, reject) => {
            let params = {
                "current_page": 1,
                "per_page": 9999,
                "dict_code": "DRIECT_ATTACHED_PROTOCOL"
            }
            DictAPI.list(params)
                .then(({ data }) => {
                    if (data.code ==200) {
                        resolve(data.data.data);
                    } else {
                        reject(data);
                    }
                })
                .catch(err => reject(err))
        })
    }

    return {
        getDeviceProtocolList
    }
}