import {computed, ref} from "@vue/composition-api/dist/vue-composition-api";
import {reactive} from "@vue/composition-api";
import {warning_log_list} from "@/api/warning";
import {dateFormat} from "@/utils/tool";

export default function useAlarmIndex(){
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive(defaultParams())
    let total = ref(0)

    function getAlarmIndex(){
        if(loading.value) return
        loading.value = true

        warning_log_list(washParams(params)).then(({data})=>{
            if(data.code === 200) {
                tableData.value = data.data.data ? washData(data.data.data) : [];
                total.value = data.data.total;
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    getAlarmIndex()

    // 清洗请求参数
    function washParams(params){
        let copyParams = JSON.parse(JSON.stringify(params))
        // 数组转字符串
        // if(Array.isArray(copyParams.business_id)) {
        //     // 业务数组内只有一项
        //     copyParams.business_id = copyParams.business_id.join("")
        // }
        if(Array.isArray(copyParams.asset_id)) {
            // 资产级联选择器返回数组，只用最后一项
            copyParams.asset_id = copyParams.asset_id.slice(-1).join("")
        }
        return copyParams
    }

    // 清洗数据
    function washData(data_array){
        return data_array.map((item)=>{
            // 格式化数据
            item.created_at = dateFormat(item.created_at )
            return item
        })
    }

    // 默认请求参数
    function defaultParams(){
        return {
            page: 1,
            limit: 10,
            business_id: "",
            device_id: "",
            asset_id: "",
            start_date: "",
            end_date: "",
        }
    }

    // 日期选择器
    let datetimerange = computed({
        get(){
            return [params.start_date, params.end_date]
        },
        set(val){
            // 日期选择器清空时 val = null
            if(!val){
                params.start_date = ""
                params.end_date = ""
            } else {
                params.start_date = val[0]
                params.end_date = val[1]
            }
        }
    })

    // 搜索
    function handleSearch(){
        params.page = 1
        getAlarmIndex()
    }

    // 重置查询
    function handleReset(){
        // console.log('handleReset')
        // 逐个赋值
        let dp = defaultParams()
        for (const key in dp) {
            if(key in params) {
                params[key] = dp[key]
            }
        }

        getAlarmIndex()
    }

    return {
        tableData,
        loading,
        params,
        total,
        datetimerange,
        getAlarmIndex,
        handleReset,
        handleSearch,
    }
}