import {computed, reactive, ref} from "@vue/composition-api/dist/vue-composition-api";
import {kv_index} from "@/api/soup";
import {is_string} from "@/utils/helpers";
import moment from "moment";
import {dateFormat} from "@/utils/tool";

export default function useDataIndex() {
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive(defaultParams())
    let total = ref(0)

    // el 日期选择需要数组，请求需要字符串
    let datetimerange = computed({
    
        set(val){
            params.start_time = val[0]
            params.end_time = val[1]
        }
    })

    // 请求接口
    function getKvIndex(){
        if(loading.value) return
        loading.value = true

        kv_index(params).then(({data}) => {
            if(data.code === 200) {
                tableData.value = wasData(data.data.data)
                console.log("==============kvIndex=================")
                console.log(tableData.value)
                console.log("==============kvIndex=================")
                total.value = data.data.total
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    getKvIndex()

    // 清洗数据
    function wasData(data_array){
        return data_array.map((item)=>{
            // 格式化数据
            item.FeedingEndTime = dateFormat(item.FeedingEndTime / 1000)
            item.FeedingStartTime = dateFormat(item.FeedingStartTime / 1000)
            item.OrderTime = dateFormat(item.OrderTime / 1000)
            item.SoupEndTime = dateFormat(item.SoupEndTime / 1000)
            item.SoupStartTime = dateFormat(item.SoupStartTime / 1000)
            return item
        })
    }

    // 搜索
    function handleSearch(filter){
        // 有传参的时候才赋值查询
        if(filter){
            if('token' in filter && is_string(filter.token)){
                params.token = filter.token
            }
        }
        getKvIndex()
    }

    // 默认请求参数
    function defaultParams(){
        return {
            "current_page": 1,
            "per_page": 10,
            "shop_name": "",
        }
    }

    // 重置查询
    function handleReset(){
        // 逐个赋值
        let dp = defaultParams()
        for (const key in dp) {
            if(key in params) {
                params[key] = dp[key]
            }
        }

        getKvIndex()
    }


    return {
        tableData,
        loading,
        params,
        total,
        getKvIndex,
        datetimerange,
        handleSearch,
        handleReset
    }
}