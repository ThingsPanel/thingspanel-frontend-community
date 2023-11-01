import {reactive, ref} from "@vue/composition-api/dist/vue-composition-api";
import {operation_index} from "@/api/operation";
import {is_string} from "@/utils/helpers";
import {dateFormat} from "@/utils/tool";

export default function useOperationIndex() {
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive({
        search: "",
        limit: 10,
        page: 1,
        ip: "",
        path: "",
    })

    let total = ref(0)

    // 获取列表
    function getOperationIndex(){
        if(loading.value) return
        loading.value = true

        // 发送请求
        operation_index(params).then(({data})=>{
            if(data.code === 200) {
                tableData.value = washData(data.data.data)
                total.value = data.data.total
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    getOperationIndex()

    // 筛选
    function handleSearch(filter){
        // 有传参的时候才赋值查询
        if(filter){
            if('ip' in filter && is_string(filter.ip)){
                params.ip = filter.ip
            }

            if('path' in filter && is_string(filter.path)){
                params.path = filter.path
            }
        }

        params.page = 1
        getOperationIndex()
    }

    // 重置
    function handleReset(){
        params.page = 1
        params.path = ""
        params.ip = ""

        getOperationIndex()
    }

    // type 的翻译
    let type_dict = {
        1: "COMMON.LOG1",
        2: "COMMON.LOG2",
        3: "COMMON.LOG3",
        4: "COMMON.LOG4",
        5: "COMMON.LOG5",
        6: "COMMON.LOG6",
        7: "COMMON.LOG7",
        8: "COMMON.LOG8",
        9: "COMMON.LOG9",
        10: "COMMON.LOG10",
        11: "COMMON.LOG11",
    };

    // 洗数据
    function washData(data_array){
        return data_array.map((item)=>{
            item.type = item.type ? type_dict[item.type] : ""
            // 格式化日期
            item.created_at = dateFormat(item.created_at)
            // 格式化json
            item.detailed = JSON.parse(item.detailed)
            // 请求时间加单位毫秒
            item.detailed.request_time += 'ms'
            return item
        })
    }

    return {
        tableData,
        loading,
        total,
        params,
        getOperationIndex,
        handleSearch,
        handleReset,
    }
}