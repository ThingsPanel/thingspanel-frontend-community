import {business_add, business_delete, business_edit} from "@/api/business";
import {message_error, message_success} from "@/utils/helpers";
import {dateFormat} from "@/utils/tool";

export default function useBusinessCUD(tableData){
    // 创建业务
    function handleCreate(){
        // 创建时添加一个空数据到 tableData
        tableData.value.unshift({
            id: Date.now(),
            name: "",
            created_at: "",
            status: "creating"
        })
    }

    // 保存当前编辑的 取消时恢复
    let currentEditing = {name: ""};

    // 修改业务名
    function handleEdit(item){
        // 保存编辑前的状态，取消时恢复
        currentEditing.name = item.name
        item.status = "editing"
    }

    // 取消编辑或新建
    function handleCancel(item){
        if(item.status === "editing") {
            item.name = currentEditing.name
        }else if(item.status === "creating") {
            // 取消创建的时候删除本条数据
            let index = tableData.value.indexOf(item)
            tableData.value.splice(index, 1)
        }
        item.status = null
    }

    // 保存编辑或新建
    function handleSave(item){
        if(item.status === "editing"){
            business_edit({id: item.id, name:item.name}).then(({data})=>{
                if(data.code === 200){
                    message_success("修改成功")
                    item.status = null
                }
            })
        } else if(item.status === "creating") {
            business_add({name: item.name}).then(({data})=>{
                if(data.code === 200) {
                    // 洗一下数据 格式化日期
                    item.id = data.data.id
                    item.name = data.data.name
                    item.created_at = dateFormat(data.data.created_at)
                    item.status = null
                    message_success("创建成功")
                }
            })
        }
    }

    // 删除
    function handleDelete(item){
        business_delete({id: item.id}).then(({data})=>{
            console.log(data)
            if(data.code === 200) {
                let index = tableData.value.indexOf(item)
                tableData.value.splice(index, 1)
                message_success("删除成功")
            }else{
                message_error(data.message)
            }
        })
    }

    return {
        handleCreate,
        handleEdit,
        handleCancel,
        handleSave,
        handleDelete,
    }
}