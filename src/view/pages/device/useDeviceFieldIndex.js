import {device_field_index} from "@/api/device";
import {ref} from "@vue/composition-api/dist/vue-composition-api";

export default function useDeviceFieldIndex(device_id){
    let tableData = ref([])

    // let response = await device_field_index({device_id: device_id})
    // if(response.data.code === 200){
    //     tableData.value = washTableData(response.data.data)
    // }

    device_field_index({device_id: device_id}).then(({data})=>{
        if(data.code === 200) {
            tableData.value = washTableData(data.data)
        }
    })

    // 清洗数据
    function washTableData(array_data){
        return array_data.map((item)=>({
            device_id: item.device_id,
            field_from: item.field_from,
            field_to: item.field_to,
            id: item.id,
            errors: {
                field_from: "",
                field_to: "",
            }
        }))
    }

    return {
        tableData,
        washTableData
    }
}