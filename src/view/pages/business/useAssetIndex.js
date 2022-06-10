import {asset_list_a, asset_list_b} from "@/api/asset";
import {ref} from "@vue/composition-api/dist/vue-composition-api";
import {reactive} from "@vue/composition-api";
import {device_list} from "@/api/device";
import axios from "axios";

export default function useAssetIndex() {
    let tableData = ref([])
    let loading = ref(false)

    let params = reactive({
        page: 1,
        limit: 10,
    })

    function getFirstLevel(business_id){
        if(loading.value) return;
        loading.value = true;

        asset_list_a({business_id}).then(({data})=>{
            if(data.code === 200) {
                // console.log(data.data)
                tableData.value = data.data ? washAssetData(data.data, true) : []
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    // 二级以后同时获取分组和设备
    function getSecondLevel(asset_id) {
        if(loading.value) return;
        loading.value = true;

        axios.all([
            asset_list_b({asset_id}),
            device_list({asset_id: asset_id, current_page:1, per_page:100})]
        ).then(axios.spread((asset_response, device_response)=>{
            let asset_data = []
            if(asset_response.data.code === 200 && asset_response.data.data){
                asset_data = washAssetData(asset_response.data.data)
            }

            let device_data = []
            if(device_response.data.code === 200 && device_response.data.data){
                // TODO 分页
                device_data = washDeviceData(device_response.data.data.data)
            }

            tableData.value = [...asset_data,...device_data]
        })).finally(()=>{
            loading.value = false
        })
    }

    function washAssetData(array_data) {
        return array_data.map((item)=>({
            id: item.id,
            name: item.name,
            is_asset: true,
            icon: "el-icon-folder"
        }))
    }

    function washDeviceData(array_data) {
        return array_data.map((item)=>({
            id: item.device,
            name: item.device_name,
            is_asset: false,
            icon: "el-icon-document"
        }))
    }

    return {
        tableData,
        loading,
        getFirstLevel,
        getSecondLevel,
    }
}