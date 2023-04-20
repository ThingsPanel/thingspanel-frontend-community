import {warning_show} from "@/api/automation";
import {reactive, ref} from "@vue/composition-api";

export default function useAlarmStrategyIndex(id) {
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive({
        limit: 10,
        page: 1,
        wid: id,
    })
    let total = ref(0);

    function getAlarmStrategyIndex(page){
        console.log("====getAlarmStrategyIndex", page)
        if(page) params.page = page

        if(loading.value) return
        loading.value = false

        warning_show(params).then(({data})=>{
            if(data.code === 200) {
                tableData.value = data.data.data
                total.value = data.data.total;
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    getAlarmStrategyIndex()

    return {
        tableData,
        params,
        total,
        loading,
        getAlarmStrategyIndex,
    }
}