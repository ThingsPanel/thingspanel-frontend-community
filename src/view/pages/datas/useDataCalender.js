import {computed, reactive} from "@vue/composition-api/dist/vue-composition-api";
import {business_index} from "@/api/business";
import {asset_list} from "@/api/asset";

export default function useDataCalender(params){
    let cascaderData = computed({
        get(){
            return [params.business_id, params.asset_id]
        },
        set(val){
            params.business_id = val[0]
            params.assert_id = val[1]
        }
    })

    let calenderProps = reactive({
        lazy: true,
        lazyLoad(node, resolve) {
            const { level } = node;
            if(level === 0) {
                business_index({page: 1}).then(({data})=>{
                    if(data.code === 200) {
                        const nodes = data.data.data.map((item)=>({
                            value: item.id,
                            label: item.name,
                        }))
                        // 返回节点
                        resolve(nodes)
                    }
                })
            }else if(level === 1){
                // 第二级返回父级的 id
                let business_id = node.data.value
                asset_list({business_id}).then(({data})=>{
                    // 默认的二级节点
                    let nodes = [{
                        value: "",
                        label: "全部",
                        leaf: true,
                    }]

                    // 有第二级数据的时候，data不为空
                    if(data.code === 200 && data.data) {
                        let n = data.data.map((item)=>({
                            value: item.id,
                            label: item.name?item.name:item.id, // 没有名字用id
                            leaf: true
                        }))
                        // 追加到 nodes 尾
                        nodes.push(...n)
                    }

                    // 返回节点
                    resolve(nodes)
                })
            }
        }
    })

    return {
        cascaderData,
        calenderProps,

    }
}