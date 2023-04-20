export default function useTableDataCUD(tableData, getList){

    function add_alarm(item){
        // tableData.value.push(item)
        // 因为新增后没有返回值，id 为空， 所以这里重新获取列表
        // 新增和编辑共用一个表单通过 id 来判断
        getList && getList(1)
    }

    function remove_alarm(item){
        let index = tableData.value.indexOf(item)
        tableData.value.splice(index, 1)
    }

    function update_alarm(item, new_item){
        getList && getList(1)
        // let index = tableData.value.indexOf(item)
        // tableData.value.splice(index, 1, new_item)
    }

    return {
        add_alarm,
        remove_alarm,
        update_alarm,
    }
}