import DictAPI from "@/api/dict.js"
import {ref} from "@vue/composition-api";
export default function useDeviceSettingIndex() {

    // 设备传输协议列表
    let deviceProtocolList = ref([]);
    // getDeviceProtocolList();

    /**
     * 获取设备传输协议列表
     */
    function getDeviceProtocolList() {

        let params = {
            "current_page": 1,
            "per_page": 9999,
            "dict_code": "DRIECT_ATTACHED_PROTOCOL"
        }
        DictAPI.list(params)
            .then(({ data }) => {
                if (data.code ==200) {
                    console.log("====useDeviceSettingIndex", data.data)
                    deviceProtocolList.value = data.data.data;
                }
            })
    }
}