import {asset_update} from "@/api/asset";

export default function useBusinessGroupCUD(tableData, business_id, deviceGroupOptions){
    function handleCreate(){
        tableData.value.unshift({
            id: "",
            name: "",
            parent_group: "/",
            errors:{
                name: "",
                parent_group: "",
            }
        })
    }

    function handleDelete(item){
        let index = tableData.value.indexOf(item)
        tableData.value.splice(index, 1)
    }

    function getParentGroupId(parent_group){
        let parent_id = ""
        console.log(deviceGroupOptions)
        deviceGroupOptions.value.some((item)=>{
            if(item.device_group === parent_group){
                parent_id = item.id
                return true
            }
        })

        return parent_id
    }

    function handleSave(item){
        console.log(item)
        console.log(getParentGroupId(item.parent_group))
        return ;

        if(item.id){
            asset_update({
                business_id: business_id.value,
                id: item.id,
                name: item.name,
                parent_id: getParentGroupId(item.parent_group)
                // tier: 2
            }).then(({data})=>{
                console.log(data)
            })
        }else{

        }
    }

    return {
        handleCreate,
        handleDelete,
        handleSave
    }
}