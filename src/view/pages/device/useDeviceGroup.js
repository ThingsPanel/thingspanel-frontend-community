import {ref} from "@vue/composition-api/dist/vue-composition-api";
import {device_group_drop} from "@/api/asset";

export default function useDeviceGroup(business_id){
    let deviceGroupOptions = ref([])

    function getGroupOptions(){
        device_group_drop({business_id}).then((({data})=>{
            if(data.code === 200 && data.data) {
                deviceGroupOptions.value = data.data
            }
        }))
    }

    getGroupOptions()

    return {
        deviceGroupOptions,
        getGroupOptions,
    }
}