import {computed, reactive, ref} from "@vue/composition-api/dist/vue-composition-api";
import {kv_index} from "@/api/kv";
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
        get(){
            return [params.start_time, params.end_time]
        },
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
            item.ts = dateFormat(item.ts)
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

        params.page = 1
        getKvIndex()
    }

    // 默认请求参数
    function defaultParams(){
        return {
            "business_id": "",
            "limit": 10,
            "page": 1,
            "entity_id": "",
            "type": 4,
            "start_time": moment().subtract(7, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
            "token": "",
            "end_time": moment().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
            "key":""
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