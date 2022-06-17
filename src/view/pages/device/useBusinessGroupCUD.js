import {asset_add, asset_delete, asset_update} from "@/api/asset";
import {message_error, message_success} from "@/utils/helpers";

export default function useBusinessGroupCUD(tableData, business_id, handleChange){
    // 创建
    function handleCreate(){
        tableData.value.unshift({
            id: "",
            name: "",
            parent_id: "/",
            errors:{
                name: "",
                parent_id: "",
            }
        })
    }

    // 删除操作
    function handleDelete(item){
        if(item.id){
            asset_delete({
                id: item.id
            }).then(({data})=>{
                if(data.code === 200){
                    message_success("删除成功")
                    let index = tableData.value.indexOf(item)
                    tableData.value.splice(index, 1)
                    handleChange()
                }
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

        if(item.id){
            asset_update({
                business_id: business_id.value,
                id: item.id,
                name: item.name,
                parent_id: item.parent_id,
                // tier: 2
            }).then(({data})=>{
                if(data.code === 200){
                    message_success("修改成功")
                    handleChange()
                }
                console.log(data)
            })
        }else{
            asset_add({
                business_id: business_id.value,
                name: item.name,
                parent_id: item.parent_id,
            }).then(({data})=>{
                if(data.code === 200){
                    message_success("添加成功")
                    handleChange()
                }
                console.log(data)
            })
        }
    }

    return {
        handleCreate,
        handleDelete,
        handleSave
    }
}