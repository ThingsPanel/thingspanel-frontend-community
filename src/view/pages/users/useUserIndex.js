import {ref,reactive} from "@vue/composition-api";
import {user_find_all_roles, user_index} from "@/api/user";

export default function useUserIndex(){
    let tableData = ref([])
    let rolesData = ref([])
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

    /**
     * 打开用户列表时获取一次所有角色列表
     */
    function getAllRoles(){
        console.log("=================getAllRoles==============")
        let query = {
            current_page: 1,
            per_page: 36
        }

        // 发送请求
        user_find_all_roles(query).then(({data})=>{
            if(data.code === 200) {
                rolesData.value = data.data.data
            }
        })

    }

    getUserIndex()
    getAllRoles()

    return {
        tableData,
        rolesData,
        getUserIndex,
        loading,
        params,
        total,
    }
}