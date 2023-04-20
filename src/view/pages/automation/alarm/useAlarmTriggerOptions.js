import {ref, watch} from "@vue/composition-api";
import {automation_show, automation_symbol} from "@/api/automation";
import i18n from "@/core/plugins/vue-i18n"
import PluginAPI from "@/api/plugin"

export default function useAlarmTriggerOptions(formData){
    let triggerOptions = ref([])

    // watch(()=>formData.bid, (val)=>{
    //     if(val){
    //         automation_show({bid: val}).then(({data})=>{
    //             if(data.code === 200 && data.data){
    //                 triggerOptions.value = data.data;
    //             }
    //         })
    //     }
    // }, {
    //     immediate: true
    // })

    watch(()=>formData.pluginId, (val)=>{
        if(val){
            let param = {current_page: 1, per_page: 10, id: val}
            PluginAPI.page(param)
                .then(({data}) => {
                    if (data.code == 200 && data.data.data && data.data.data.length > 0) {
                        let pluginJsonStr = data.data.data[0].chart_data ? data.data.data[0].chart_data : "{}";
                        let pluginObj = JSON.parse(pluginJsonStr);
                        triggerOptions.value = pluginObj.tsl.properties;
                    }
                })
        }
    },{immediate: true})

    let symbolOptions = ref([])

    automation_symbol().then(({data})=>{
        if(data.code === 200 && data.data){
            symbolOptions.value = data.data
        }
    })

    let operatorOptions = ref([
        {label: i18n.t('AUTOMATION.OR'), value: "||"},
        {label: i18n.t('AUTOMATION.AND'), value: "&&"},
    ])

    // 控制策略按类型选择输入框
    let typeOptions = ref([
        {label: "设备条件类型", value: 1},
        {label: "时间条件类型", value: 2},
    ])

    return {
        triggerOptions,
        symbolOptions,
        operatorOptions,
        typeOptions,
    }
}