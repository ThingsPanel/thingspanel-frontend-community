import {reactive, ref} from "@vue/composition-api";
import {device_list} from "@/api/device";
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

    let devicePluginOptions = ref([])
    asset_index().then(({data})=>{
        if(data.code === 200){
            devicePluginOptions.value = data.data
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
            return {
                id: item.device,
                name: item.device_name,
                asset_id: item.asset_id,
                // asset_name: item.asset_name,
                token: item.device_token,
                type: item.device_type,
                latest_ts: item.latest_ts,
                protocol: item.protocol,
                d_id: item.d_id,
                location: item.location,
                structure: item.structure ? item.structure : [],
                errors: {
                    name: "",
                    asset_id: "",
                    type: "",
                    protocol: "",
                }
            }
        })
    }

    // 映射设备插件
    function deviceTypeMap(type){
        let result = ""
        devicePluginOptions.value.some((device_item)=>{
            if(device_item.id === type) {
                result = device_item.name
                // 查到后终止循环
                return true
            }
        })

        return result;
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
            name: "",
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
        devicePluginOptions,
        deviceTypeMap,
    }
}