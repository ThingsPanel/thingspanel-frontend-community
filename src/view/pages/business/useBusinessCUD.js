import {business_add, business_delete, business_edit} from "@/api/business";
import {message_error, message_success} from "@/utils/helpers";
import {dateFormat} from "@/utils/tool";
import {ref, reactive} from "@vue/composition-api";

export default function useBusinessCUD(tableData){
    let businessForm = ref()
    let loading = ref(false)

    // 表单数据
    let formData = reactive({
        name: "",
    })

    let rules = reactive({
        name:[
            {required: true, message: "请填写业务名"}
        ]
    })

    // 创建业务
    function handleCreate(){
        // 创建时添加一个空数据到 tableData
        tableData.value.unshift({
            id: Date.now(),
            name: "",
            created_at: "",
            status: "creating"
        })

        formData.name = ""
    }

    // 保存当前编辑的 取消时恢复
    let currentEditing = {name: ""};

    // 修改业务名
    function handleEdit(item){
        // 标记当前项为编辑状态
        item.status = "editing"
        // 表单赋值
        formData.name = item.name
    }

    // 取消编辑或新建
    function handleCancel(item){
        if(item.status === "creating") {
            // 取消创建的时候删除本条数据
            let index = tableData.value.indexOf(item)
            tableData.value.splice(index, 1)
        }
        item.status = null
        formData.name = ""
    }

    // 保存编辑或新建
    function handleSave(item){
        businessForm.value.validate((valid)=>{
            // 表单验证不通过返回
            if(!valid) return

            if(loading.value) return
            loading.value = true

            if(item.status === "editing"){
                business_edit({id: item.id, name:formData.name}).then(({data})=>{
                    if(data.code === 200){
                        message_success("修改成功")
                        // 跟新后 data 返回空，所以用 formData
                        item.name = formData.name
                        item.status = null
                    }
                }).finally(()=>{
                    loading.value = false
                })
            } else if(item.status === "creating") {
                business_add({name: formData.name}).then(({data})=>{
                    if(data.code === 200) {
                        // 洗一下数据 格式化日期
                        item.id = data.data.id
                        item.name = data.data.name
                        item.created_at = dateFormat(data.data.created_at)
                        item.status = null
                        message_success("创建成功")
                    }
                }).finally(()=>{
                    loading.value = false
                })
            }
        })

    }

    // 删除
    function handleDelete(item){
        business_delete({id: item.id}).then(({data})=>{
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
        businessForm,
        formData,
        rules,
        handleCreate,
        handleEdit,
        handleCancel,
        handleSave,
        handleDelete,
    }
}