import {reactive, ref} from "@vue/composition-api";
import {device_update} from "@/api/device";
import {message_error, message_success} from "@/utils/helpers";

export default function useDeviceCUD(tableData){
    let deviceForm = ref()
    let formData = reactive({
        name: "", // 设备名
        type: "", // 插件
        asset_id: "",
    })

    let rules = reactive({
        name: [
            {required: true, message: "请填写设备名"}
        ],
        type: [
            {required: true, message: "请选择插件"}
        ],
        asset_id: [
            {required: true, message: "请选择分组"}
        ]
    })

    // 进入创建状态
    function handleCreate(){
        tableData.value.unshift({
            id: Date.now(),
            name: "",
            type: "",
            created_at: "",
            status: "creating",
        })

        formData.name = ""
    }

    // 进入修改状态
    function handleEdit(item){
        // 标记当前项为编辑状态
        item.status = "editing"
        // 表单赋值
        formData.name = item.device_name
        formData.type = item.device_type
        formData.asset_id = item.asset_id
    }

    function handleCancel(item){
        if(item.status === "creating") {
          // 取消创建的时候删除本条数据
          let index = tableData.value.indexOf(item)
          tableData.value.splice(index, 1)
        }

        item.status = null
        // formData.name = ""
    }

    function handleSave(item) {
        deviceForm.value.validate((valid)=>{
            // 表单验证不通过返回
            if(!valid) return

            if(item.status === "editing") {
                device_update({id:item.device, ...formData}).then(({data})=>{
                    if(data.code === 200) {
                        message_success("更新成功！")

                        // 保存成功后赋值
                        item.device_name = data.data.name
                        item.device_type = data.data.type

                        // 更改编辑状态
                        item.status = null
                    }else{
                        message_error(data.message)
                    }
                })
            } else if(item.status === "creating") {

            }
        })
    }

    function handleDelete(item){
        console.log('删除设备')
    }

    return {
        deviceForm,
        formData,
        rules,
        handleCreate,
        handleEdit,
        handleCancel,
        handleSave,
        handleDelete,
    }
}