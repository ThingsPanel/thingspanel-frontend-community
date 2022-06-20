import {field_add, structure_delete} from "@/api/device";
import {message_error, message_success} from "@/utils/helpers";
import {ref} from "@vue/composition-api";

export default function useDeviceButtingCUD(tableData, device_id, washTableData, fieldOptions){
    let loading = ref(false)

    // 创建
    function handleCreate(){
        // 验证上限 一个 options 只能有一个映射
        let all_used = true
        fieldOptions.value.some((item)=>{
            item.options.some((item)=>{
                // 只要有一个未被使用的就可以新建
                if(item.disabled === false){
                    all_used = false
                    // 终止循环
                    return true
                }
            })
        })
        if(all_used) {
            message_error("已达上限")
            return;
        }

        // 添加空值
        tableData.value.unshift({
            device_id: device_id,
            field_from: "",
            field_to: "",
            errors: {
                field_from: "",
                field_to: "",
            }
        })
    }

    // 删除
    function handleDelete(item){
        if(item.id){
            if(loading.value) return
            loading.value = true

            structure_delete({id: item.id}).then(({data})=>{
                if(data.code === 200) {
                    let index = tableData.value.indexOf(item)
                    tableData.value.splice(index, 1)
                }
            }).finally(()=>{
                loading.value = false
            })
        }else{
            let index = tableData.value.indexOf(item)
            tableData.value.splice(index, 1)
        }
        message_success("删除成功！")
    }

    // 修改
    function handleSave(){
        // 没有验证通过返回
        if(!validation()) return;

        if(loading.value) return
        loading.value = true

        field_add({data:tableData.value}).then(({data})=>{
            if(data.code === 200){
                tableData.value = washTableData(data.data)
                message_success("保存成功！")
            }
        }).finally(()=>{
            loading.value = false
        })
    }

    // 验证字段
    function valid_field(item, field){
        if(item[field]){
            item.errors[field] = ""
        }else{
            item.errors[field] = "必填项"
        }
    }

    // 验证所有字段
    function validation(){
        // 清理之前的错误
        tableData.value.some((item)=>{
            item.errors.field_from = ""
            item.errors.field_to = ""
        })

        // 检查空值
        let valid = true
        tableData.value.some((item)=>{
            if(!item.field_from){
                item.errors.field_from = "请填写"
                valid = false
            }
            if(!item.field_to){
                item.errors.field_to = "请填写"
                valid = false
            }
        })

        return valid
    }

    return {
        handleCreate,
        handleDelete,
        handleSave,
        valid_field,
    }
}