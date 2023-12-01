/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-07-31 10:24:33
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-12-01 10:16:23
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\business\useBusinessIndex.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {reactive, ref} from "@vue/composition-api";
import {business_index} from "@/api/business";
import { _debounce } from "@/utils/helpers.js";
export default function useBusinessIndex(page){
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive({
        page: page ? page : 1,
        limit: 10,
    })

    let total = ref(0)

    // 获取列表
    function getBusinessIndex(){
        if(loading.value) return;
        loading.value = true

        business_index(params).then(({data})=>{
            if(data.code === 200) {
                tableData.value = data.data.data ? washData(data.data.data) : []
                total.value = data.data.total
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    getBusinessIndex()

    function washData(data_array){
        return data_array.map((item)=>{
            // item.created_at = dateFormat(item.created_at)

            // 每个项的报错
            item.errors = {
                name: ""
            }
            // 每个项的表单
            item.formData = {
                name: "",
            }

            // 增加状态判断新建还是编辑
            item.status = null
            return item
        })
    }

    const filterInput = ref("");
    // 防抖
    const debounceSearchTextChange = _debounce((v) => {
        params.name = v.trim();
        getBusinessIndex();
    }, 1000);
    
    function filterChange(v) {
        debounceSearchTextChange(v)
    }

    return{
        tableData,
        getBusinessIndex,
        loading,
        params,
        total,
        filterInput,
        filterChange
    }
}