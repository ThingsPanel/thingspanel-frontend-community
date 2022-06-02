import {ref,reactive} from "@vue/composition-api";
import {user_index} from "@/api/user";

export default function useUserIndex(){
    let tableData = ref([])
    let loading = ref(false)
    let params = reactive({
        search: '',
        limit: 10,
        page: 1,
    })

    let total = ref(0)

    function getUserIndex(){
        if(loading.value) return;
        loading.value = true

        // 发送请求
        user_index(params).then(({data})=>{
            if(data.code === 200) {
                tableData.value = data.data.data
                total.value = data.data.total
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    getUserIndex()

    return {
        tableData,
        getUserIndex,
        loading,
        params,
        total,
    }
}