import {computed, reactive, watch} from "@vue/composition-api/dist/vue-composition-api";
import {business_index} from "@/api/business";
import {asset_list_a, asset_list_b} from "@/api/asset";
import {ref} from "@vue/composition-api";

export default function useAlarmSelect(params){
    // 业务
    let businessCascaderData = computed({
        get(){
            return [params.business_id]
        },
        set(val){
            params.business_id = val.join("")
        }
    })
    // 业务级联懒加载
    let businessProps = reactive({
        lazy: true,
        lazyLoad(node, resolve) {
            business_index({page: 1}).then(({data})=>{
                let nodes = []
                if(data.code === 200 && data.data.data) {
                    nodes = data.data.data.map((item)=>({
                        value: item.id,
                        label: item.name,
                        leaf: true,
                    }))
                    // 返回节点
                    resolve(nodes)
                }
            })
        }
    })

    // 资产 asset_id
    let assetOptions = ref([])

    // business_id 更改时 请求 资产列表
    watch(()=>params.business_id, ()=>{
        let business_id = params.business_id
        // 有 business_id 时才加载资产
        if(business_id){
            asset_list_a({business_id}).then(({data})=>{
                if(data.code === 200 && data.data) {
                    assetOptions.value = data.data.map((item)=>({
                        label: item.name?item.name:item.id, // 没名字的时候用id代替
                        value: item.id,
                    }))
                }
            })
        }else{
            // 没有 business_id 时 清空资产
            assetOptions.value = []
        }
    })

    // 业务
    let assetCascaderData = computed({
        get(){
            return [params.asset_id]
        },
        set(val){
            params.asset_id = val.join("")
        }
    })

    // let id = 0;
    let assetProps = reactive({
        lazy: true,
        checkStrictly: true,
        lazyLoad(node, resolve) {
            const { level } = node;
            if(level > 0) {
                let asset_id = node.data.value
                asset_list_b({asset_id}).then(({data})=>{
                    let nodes = []
                    if(data.code === 200 && data.data) {
                        nodes.map((item)=>({
                            label: item.name,
                            value: item.id,
                        }))
                    }
                    resolve(nodes)
                })
            }
        }
    })


    return {
        businessCascaderData,
        businessProps,
        assetOptions,
        assetProps,
        assetCascaderData,
    }
}