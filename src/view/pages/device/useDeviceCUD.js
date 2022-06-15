import {ref} from "@vue/composition-api";
import {device_add, device_delete, device_update} from "@/api/device";
import {message_error, message_success} from "@/utils/helpers";

export default function useDeviceCUD(tableData){
    let deviceForm = ref()

    // 进入创建状态
    function handleCreate(){
        tableData.value.unshift({
            id: "",
            name: "",
            type: "",
            asset_id: "",
            status: "creating",
            errors: {
                name: "",
                asset_id: "",
            }
        })
    }

    // 保存创建或更新
    function handleSave(item) {

        // 每次提交先清除错误
        item.errors.name = ""
        item.errors.asset_id = ""


        if(!item.name){
            item.errors.name="请填写用户名"
            return
        }

        if(!item.asset_id){
            item.errors.asset_id = "请选择分组"
            return
        }

        // 有id更新
        if(item.id){
            device_update({...item}).then(({data})=>{
                if(data.code === 200) {
                    message_success("更新成功！")
                }else{
                    message_error(data.message)
                }
            })
        } else {
            device_add(item).then(({data})=>{
                if(data.code === 200) {
                    message_success("创建成功！")
                    item.id = data.data.id
                    item.name = data.data.name
                }else{
                    message_error(data.message)
                }
            })
        }
    }

    function handleDelete(item){
        console.log('删除设备')
        device_delete({id: item.id}).then(({data})=>{
            if(data.code === 200) {
                message_success("删除成功！")
                let index = tableData.value.indexOf(item)
                tableData.value.splice(index, 1)
            }else{
                message_error(data.message)
            }
        })
    }

    return {
        deviceForm,
        handleCreate,
        handleSave,
        handleDelete,
    }
}