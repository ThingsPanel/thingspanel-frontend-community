export default function useTableDataCUD(tableData){

    function add_alarm(item){
        tableData.value.push(item)
    }

    function remove_alarm(item){
        let index = tableData.value.indexOf(item)
        tableData.value.splice(index, 1)
    }

    function update_alarm(item, new_item){
        let index = tableData.value.indexOf(item)
        tableData.value.splice(index, 1, new_item)
    }

    return {
        add_alarm,
        remove_alarm,
        update_alarm,
    }
}