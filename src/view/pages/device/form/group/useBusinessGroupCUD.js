import {asset_add, asset_delete, asset_update} from "@/api/asset";
import {message_error, message_success} from "@/utils/helpers";
import {ref} from "@vue/composition-api";

export default function useBusinessGroupCUD(tableData, business_id, handleChange, deviceGroupOptions){
    let loading = ref(false)

    // 创建
    function handleCreate(){
        tableData.value.unshift({
            id: "",
            name: "",
            parent_id: "0",
            sort: 100,
            errors:{
                name: "",
                parent_id: "",
            }
        })
    }

    // 删除操作
    function handleDelete(item){
        if(item.id){
            if(loading.value) return
            loading.value = true

            asset_delete({
                id: item.id
            }).then(({data})=>{
                if(data.code === 200){
                    message_success("删除成功")
                    let index = tableData.value.indexOf(item)
                    tableData.value.splice(index, 1)
                    handleChange()
                }
            }).finally(()=>{
                loading.value = false
            })
        }else{
            let index = tableData.value.indexOf(item)
            tableData.value.splice(index, 1)
        }
    }

    // 新建或修改
    function handleSave(item){
        // 先清空错误
        item.errors.name = ""
        item.errors.parent_id = ""
        item.errors.sort = ""

        // 表单校验
        if(!item.name){
            item.errors.name = "请填写用户名"
            return
        }
        if(!item.parent_id){
            item.errors.parent_id = "请选择分组"
            return
        }
        if(item.id === item.parent_id){
            item.errors.parent_id = "上级分组不能是自己"
            message_error("上级分组不能是自己")
            return
        }
        if(!item.sort){
            item.errors.sort = "请设置排序"
            return
        }

        // 设备组的层级
        let tier = get_group_tier(item, deviceGroupOptions)

        console.log('group', item)
        
        if(item.id){
            asset_update({
                business_id: business_id.value,
                id: item.id,
                name: item.name,
                sort: parseInt(item.sort),
                parent_id: item.parent_id,
                tier: tier
            }).then(({data})=>{
                if(data.code === 200){
                    message_success("修改成功")
                    handleChange()
                }
            })
        }else{
            asset_add({
                business_id: business_id.value,
                name: item.name,
                parent_id: item.parent_id,
                sort: parseInt(item.sort),
                tier: tier
            }).then(({data})=>{
                if(data.code === 200){
                    message_success("添加成功")
                    handleChange()
                }
            })
        }
    }

    // 获取新增或修改的分组层级
    function get_group_tier(current_item, deviceGroupOptions){
        let tier = 1
        if(current_item.parent_id === "0"){
            tier = 1
        }else{
            // 通过id 筛选出 options 的 device_group 字段 如：/a/b 返回的是数组
            let parent_item = deviceGroupOptions.value.filter((option)=>{
                return option.id === current_item.parent_id
            })

            if(parent_item.length){
                // 获取第一项的 device_group
                let device_group_str = parent_item[0].device_group
                // 按斜杠分割 filter 去除空字符串 + 1 得到当前层级
                tier = device_group_str.split("/").filter(d=>d).length + 1
            }
        }

        return tier
    }

    return {
        handleCreate,
        handleDelete,
        handleSave
    }
}