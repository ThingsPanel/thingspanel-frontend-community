import {reactive, ref} from "@vue/composition-api";
import {automation_index, getOneControlStrategy} from "@/api/automation";

export default function useControlStrategyIndex(id){
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive({
        business_id: id,
        limit: 10,
        page: 1,
    })
    let total = ref(0)

    let currentItem = reactive({});

    function getControlStrategyIndex(page){
        if(page) params.page = page

        if(loading.value) return
        loading.value = false

        automation_index(params).then(({data})=>{
            if(data.code === 200) {
                tableData.value = washData(data.data.data)
                total.value = data.data.total
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    function getControlStrategy(id) {
        getOneControlStrategy({ id })
            .then(({ data }) => {
                if (data.code == 200) {
                    currentItem.value = data.data;
                    console.log("====getControlStrategy", data);
                }
            })
    }

    function washData(array_data){
        return array_data.map((item)=>{
            item.config = JSON.parse(item.config)
            item.status = Number(item.status)
            return item
        })
    }

    id && getControlStrategyIndex()

    return {
        tableData,
        params,
        loading,
        total,
        currentItem,
        getControlStrategy,
        getControlStrategyIndex,
    }
}