import {reactive, ref} from "@vue/composition-api";
import {automation_index} from "@/api/automation";

export default function useControlStrategyIndex(id){
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive({
        business_id: id,
        limit: 10,
        page: 1,
    })

    let total = ref(0)

    function getControlStrategyIndex(){
        if(loading.value) return
        loading.value = false

        automation_index(params).then(({data})=>{
            if(data.code === 200) {
                tableData.value = data.data.data
                total.value = data.data.total
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    getControlStrategyIndex()

    return {
        tableData,
        params,
        loading,
        total,
        getControlStrategyIndex,
    }
}