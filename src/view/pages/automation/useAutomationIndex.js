import {reactive, ref} from "@vue/composition-api";
import {work_index} from "@/api/automation";

export default function useAutomationIndex(){
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive({
        limit: 10,
        page: 1,
        work_name: "",
    })

    let total = ref(0)

    // 获取列表
    function getAutomationIndex(){
        if(loading.value) return
        loading.value = false

        work_index(params).then(({data})=>{
            if(data.code === 200){
                total.value = data.data.total
                tableData.value = data.data.data
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    getAutomationIndex()

    return {
        loading,
        tableData,
        total,
        params,
        getAutomationIndex,
    }
}