import {ref, computed} from "@vue/composition-api/dist/vue-composition-api";
import {structure_field} from "@/api/device";

export default function useDeviceFieldOptions(tableData, device_type) {
    // let fieldOptions = ref([])
    let fieldOptionsData = ref([])

    // 获取下拉菜单
    if(device_type) {
        // let response = await structure_field({field: device_type})
        // if(response.data.code === 200){
        //     console.log(response.data.data)
        //     fieldOptionsData.value = response.data.data
        // }
        structure_field({field: device_type}).then(({data})=>{
            if(data.code === 200){
                fieldOptionsData.value = data.data
            }
        })
    }

    // 使用过的 options
    function isUsed(key){
        return tableData.value.some((item)=>{
            if(item.field_to === key) return true
        })
    }

    // 格式化数据
    function washData(array_data){
        // 第一层是选项组的 label
        return array_data.map((item)=>({
            label: item.name,
            // 第二层是 options
            options: item.field.map((item)=>({
                value: item.key,
                label: item.name,
                disabled: isUsed(item.key), // 标记不可用
            }))
        }))
    }

    // 选项
    let fieldOptions = computed(()=>{
        return washData(fieldOptionsData.value)
    })

    return {
        fieldOptions
    }
}