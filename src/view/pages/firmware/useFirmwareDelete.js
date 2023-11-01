/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-07-31 10:24:33
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-11-01 10:24:04
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\firmware\useFirmwareDelete.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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