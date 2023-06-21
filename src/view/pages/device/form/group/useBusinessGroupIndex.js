import {reactive, ref} from "@vue/composition-api/dist/vue-composition-api";
import {asset_list_c} from "@/api/asset";

export default function useBusinessGroupIndex(business_id){
    let tableData = ref([])
    let params = reactive({
        business_id: business_id.value,
        current_page: 1,
        per_page: 10
    })

    let total = ref(0)

    // 获取业务下的分组
    function getGroupIndex(){
        asset_list_c(params).then(({data})=>{
            if(data.code === 200){
                if(data.data){
                    tableData.value = washData(data.data)
                }else{
                    tableData.value = []
                }
            }
        })
    }

    getGroupIndex()

    // 业务筛选
    function handleSearch(){
        params.current_page = 1
        params.business_id = business_id.value
        getGroupIndex()
    }

    function washData(array_data){
        return array_data.map((item)=>({
            id: item.id,
            name: item.name,
            sort: item.sort,
            parent_id: item.parent_id,
            errors:{
                name: "",
                parent_id: "",
            }
        }))
    }

    return {
        tableData,
        params,
        total,
        getGroupIndex,
        handleSearch,
    }
}