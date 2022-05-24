import {ref} from '@vue/composition-api'

export default function useFirmwareDelete(data_list){
    let deleteItemIndex = ref(-1)
    let dialogDelete = ref(false)

    function deleteItem(item) {
      dialogDelete.value = true
      deleteItemIndex = data_list.value.indexOf(item)
    }

    function deleteItemConfirm(){
        data_list.value.splice(deleteItemIndex, 1)
        dialogDelete.value = false
    }

    function closeDelete(){
        dialogDelete.value = false
    }

    return {
        dialogDelete,
        deleteItem,
        deleteItemConfirm,
        closeDelete,
    }
}