import {onBeforeUnmount, reactive, ref} from "@vue/composition-api";
import {asset_index} from "@/api/asset";
import {is_string} from "@/utils/helpers";
import {getDeviceListStatus, getDeviceTree} from "@/api/device";
import { useStore } from "@/core/services/store";

export default function useDeviceIndex(business_id) {
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive(defaultParams())

    let deviceIds = ref([]);

    if (business_id) params.business_id = business_id

    let total = ref(0)

    const store = useStore();


    /**
     * 获取设备列表（含网关/设备)
     */
    function getDeviceIndex() {
        if (loading.value) return;
        loading.value = true

        getDeviceTree(washParams(params)).then(({data}) => {
            if (data.code === 200) {
                total.value = data.data.total
                let { table, ids } = washData(data.data.data);
                tableData.value = data.data.data ? table : [];
                deviceIds.value = ids;
                console.log("====getDeviceTree.ids", ids);
                getDeviceStatus(ids);
            }
        }).finally(() => {
            loading.value = false
        })
    }

    let devicePluginOptions = ref([])
    asset_index().then(({data}) => {
        if (data.code === 200) {
            devicePluginOptions.value = data.data
        }
    }).finally(() => {
        getDeviceIndex()
    })

    // 清洗请求参数
    function washParams(params) {
        let copyParams = JSON.parse(JSON.stringify(params))

        // 数组转字符串
        if (Array.isArray(copyParams.asset_id)) {
            // 资产级联选择器返回数组，只用最后一项
            copyParams.asset_id = copyParams.asset_id.slice(-1).join("")
        }
        return copyParams
    }


    function washData(data_array) {
        let table = [];
        let ids = [];
        if (!data_array) return {table, ids};
        data_array.forEach(item => {
            let row = fillData(item);
            if (item.children) {
                row.children = [];
                item.children.forEach(child => {
                    row.children.push(fillData(child));
                    // ids.push(child.device);
                })
            }
            ids.push(row.device);
            table.push(row);
        })
        return {table, ids};
    }

    function fillData(item) {
        let data = {
            id: item.device,
            device: item.device,
            name: item.device_name,
            asset_id: item.asset_id,
            token: item.device_token,
            device_type: item.device_type,
            device_state: item.device_state,
            type: item.type,
            plugin_name: item.plugin_name,
            latest_ts: item.latest_ts,
            protocol: item.protocol,
            d_id: item.d_id,
            location: item.location,
            structure: item.structure ? item.structure : [],
            parent_id: item.parent_id,
            additional_info: item.additional_info,
            protocol_config: item.protocol_config,
            subDeviceAddress: item.sub_device_addr ? item.sub_device_addr : "",
            chart_names: item.chart_names,
            errors: {
                name: "",
                asset_id: "",
                type: "",
                device_type: "",
                protocol: "",
            }
        };
        return data;
    }

    // 映射设备插件
    function deviceTypeMap(type) {
        let result = ""
        devicePluginOptions.value.some((device_item) => {
            if (device_item.id === type) {
                result = device_item.name
                // 查到后终止循环
                return true
            }
        })

        return result;
    }

    // 默认请求参数
    function defaultParams() {
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
    function handleSearch(filter) {
        // 有传参的时候才赋值查询
        if (filter) {
            if ('token' in filter && is_string(filter.token)) {
                params.token = filter.token
            }
        }

        params.current_page = 1
        getDeviceIndex()
    }

    // 重置
    function handleReset() {
        // 逐个赋值
        let dp = defaultParams()
        for (const key in dp) {
            if (key in params && key !== "business_id") {
                params[key] = dp[key]
            }
        }
        getDeviceIndex()
    }

    let timer = null;

    /**
     * 获取设备在线状态
     * @param ids
     */
    function getDeviceStatus(ids) {
        console.log("====getDeviceStatus.getTimers:", store.getters.getTimers(business_id))
        if (timer) clearInterval(timer);
        if (!ids || ids.length == 0) return;
        const fn = () => {
            getDeviceListStatus({ device_id_list: ids })
                .then(({ data }) => {
                    if (data.code == 200) {
                        tableData.value.forEach(item => {
                            item.device_state = data.data[item.id] ? data.data[item.id] : "0";
                        })
                    }
                })
        }
        fn();
        timer = setInterval(fn, 5000);
        // store.commit("addTimer", {id: business_id, timer});

    }

    onBeforeUnmount(() => {
        if (timer) clearInterval(timer);
    })

    return {
        tableData,
        loading,
        params,
        deviceIds,
        getDeviceTree,
        getDeviceIndex,
        total,
        handleSearch,
        handleReset,
        devicePluginOptions,
        deviceTypeMap,
    }
}

