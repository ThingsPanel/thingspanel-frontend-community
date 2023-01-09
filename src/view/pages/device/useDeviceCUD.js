import {ref} from "@vue/composition-api";
import {device_add, device_delete, device_update} from "@/api/device";
import {message_success} from "@/utils/helpers";

export default function useDeviceCUD(tableData){
    let deviceForm = ref()
    let loading = ref(false)

    // 进入创建状态
    function handleCreate(){
        tableData.value.unshift({
            id: "",
            name: "",
            asset_id: "",
            d_id: "",
            location: "",
            protocol: "mqtt",
            device_type: "1",
            additional_info: "{\"runningInfo\":{\"thresholdTime\":60}}",
            errors: {
                name: "",
                asset_id: "",
                device_type: ""
            }
        })
    }

    /**
     * 保存创建或更新
     * @param item
     * @param cb 回调
     */
    function handleSave(item, cb) {

        console.log("===============handleSave====================")
        console.log(item)
        console.log("================handleSave====================")

        // 每次提交先清除错误
        item.errors.name = ""
        item.errors.asset_id = ""
        item.errors.type = ""


        if(!item.name){
            item.errors.name="请填写用户名"
            return
        }

        if(!item.asset_id){
            item.errors.asset_id = "请选择分组"
            return
        }

        console.log("====handleSave", loading.value)
        if(loading.value) return
        loading.value = true


        // 有id更新
        if(item.id){
            device_update({...item}).then(({data})=>{
                if(data.code === 200) {
                    message_success("更新成功！");
                    if (cb) {
                        cb.call();
                    }
                }
            }).finally(()=>{
                loading.value = false;
            })
        } else {
            device_add(item).then(({data})=>{
                if(data.code === 200) {
                    message_success("创建成功！");
                    item.id = data.data.id;
                    item.name = data.data.name;
                    if (cb) {
                        cb.call();
                    }
                }
            }).finally(()=>{
                loading.value = false;
            })
        }
    }

    function handleDelete(item, call){
        if(item.id){
            if(loading.value) return
            loading.value = true

            device_delete({id: item.id}).then(({data})=>{
                if(data.code === 200) {
                    message_success("删除成功！")
                    // let index = tableData.value.indexOf(item)
                    // if (index == -1) {
                    //     let parent = tableData.value.find(it => it.id == item.parent_id);
                    //     let index = parent.children.findIndex(it => it.id == item.id)
                    //     parent.children.splice(index, 1);
                    //     console.log(index)
                    // } else {
                    //     tableData.value.splice(index, 1)
                    // }
                }
            }).finally(()=>{
                loading.value = false
                call && call();
            })
        } else {
            call && call();
            message_success("删除成功！")
            // let index = tableData.value.indexOf(item)
            // console.log(index)
            // tableData.value.splice(index, 1)
        }
    }

    return {
        deviceForm,
        handleCreate,
        handleSave,
        handleDelete,
    }
}