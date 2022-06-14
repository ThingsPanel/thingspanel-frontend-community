import {reactive, ref} from "@vue/composition-api";
import {device_list} from "@/api/device";
import {dateFormat} from "@/utils/tool";
import {asset_index} from "@/api/asset";
import {is_string} from "@/utils/helpers";

export default function useDeviceIndex(business_id) {
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive(defaultParams())

    if(business_id) params.business_id = business_id

    let total = ref(0)

    function getDeviceIndex(){
        if(loading.value) return;
        loading.value = true

        device_list(washParams(params)).then(({data})=>{
            if(data.code === 200) {
                tableData.value = data.data.data ? washData(data.data.data) : []
                total.value = data.data.total
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    let device_plugin = ref([])
    asset_index().then(({data})=>{
        if(data.code === 200){
            device_plugin.value = data.data
        }
    }).finally(()=>{
        getDeviceIndex()
    })

    // 清洗请求参数
    function washParams(params){
        let copyParams = JSON.parse(JSON.stringify(params))

        // 数组转字符串
        if(Array.isArray(copyParams.asset_id)) {
            // 资产级联选择器返回数组，只用最后一项
            copyParams.asset_id = copyParams.asset_id.slice(-1).join("")
        }
        return copyParams
    }

    // 清洗数据
    function washData(data_array){
        return data_array.map((item)=>{
            item.latest_ts = item.latest_ts ? dateFormat(item.latest_ts) : ''

            // 映射设备插件
            device_plugin.value.some((device_item)=>{
                if(device_item.id === item.device_type) {
                    item.device_type = device_item.name
                    return true;
                }
            })

            return item
        })
    }

    // 默认请求参数
    function defaultParams(){
        return {
            current_page: 1,
            per_page: 10,
            business_id: "",
            asset_id: "",
            device_id: "",
            device_type: "",
            token: "",
        }
    }

    // 搜索
    function handleSearch(filter){
        // 有传参的时候才赋值查询
        if(filter){
            if('token' in filter && is_string(filter.token)){
                params.token = filter.token
            }
        }

        params.current_page = 1
        getDeviceIndex()
    }

    // 重置
    function handleReset(){
        // 逐个赋值
        let dp = defaultParams()
        for (const key in dp) {
            if(key in params && key !== "business_id") {
                params[key] = dp[key]
            }
        }

        getDeviceIndex()
    }

    return {
        tableData,
        loading,
        params,
        getDeviceIndex,
        total,
        handleSearch,
        handleReset,
        device_plugin,
    }
}