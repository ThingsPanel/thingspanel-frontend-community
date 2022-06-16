<template>
<div>
  <el-alert v-if="!device_item.type" title="请先选择插件" type="warning" show-icon :closable="false"></el-alert>

  <el-form class="inline-edit">
  <el-table :data="tableData" fit style="width: 100%">
    <el-table-column label="设备端字段名" width="auto" min-width="40%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.field_from">
          <el-input
              @blur="valid_field(scope.row, 'field_from')"
              class="w-100" size="medium"
              v-model="scope.row.field_from"
          ></el-input>
        </el-form-item>
      </template>
    </el-table-column>

    <el-table-column label="插件预设值" width="auto" min-width="40%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.field_to">
          <FieldSelector
              :group-options="fieldOptions"
              :field_to.sync="scope.row.field_to"
              @blur="valid_field(scope.row, 'field_to')"
          ></FieldSelector>
        </el-form-item>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="auto"  min-width="20%">
      <template v-slot:header="scope">
        <el-button type="indigo" class="w-100"  size="medium" @click="handleCreate()">新建</el-button>
      </template>
      <template v-slot="scope">
        <el-popconfirm title="确定要删除此项码？" @confirm="handleDelete(scope.row)">
          <el-button slot="reference" type="danger" class="w-100"  size="medium">删除</el-button>
        </el-popconfirm>
      </template>
    </el-table-column>
  </el-table>
  </el-form>

  <div class="p-3">
    <el-button type="indigo" class="w-100" size="medium" @click="handleSave()">保存</el-button>
  </div>

  <p>提示：配置错误则数据无法入库</p>
</div>
</template>

<script>
import {defineComponent, ref} from "@vue/composition-api";
import {device_field_index, field_add, structure_delete, structure_field} from "@/api/device";
import FieldSelector from "./FieldSelector.vue"
import {message_success} from "@/utils/helpers";

export default defineComponent({
  name: "DeviceButtingForm",
  components: {
    FieldSelector
  },
  props: {
    device_item: {
      required: true,
    }
  },
  setup(props, context){
    let fieldOptions = ref([])

    let tableData = ref([])

    device_field_index({device_id: props.device_item.id}).then(({data})=>{
      if(data.code === 200) {
        tableData.value = washTableData(data.data)
      }
    })

    // 清洗数据
    function washTableData(array_data){
      return array_data.map((item)=>({
        device_id: item.device_id,
        field_from: item.field_from,
        field_to: item.field_to,
        id: item.id,
        errors: {
          field_from: "",
          field_to: "",
        }
      }))
    }

    if(props.device_item.type) {
      structure_field({field: props.device_item.type}).then(({data})=>{
        if(data.code === 200){
          fieldOptions.value = data.data.map((item)=>{
            return {
              label: item.name,
              options: item.field.map((item)=>({
                value: item.key,
                label: item.name,
                disabled: false,
              }))
            }
          })
        }
      })
    }

    function handleCreate(){
      tableData.value.unshift({
        device_id: props.device_item.id,
        field_from: "",
        field_to: "",
        errors: {
          field_from: "",
          field_to: "",
        }
      })
    }

    function handleDelete(item){
      if(item.id){
        structure_delete({id: item.id}).then(({data})=>{
          if(data.code === 200) {
            let index = tableData.value.indexOf(item)
            tableData.value.splice(index, 1)
          }
        })
      }else{
        let index = tableData.value.indexOf(item)
        tableData.value.splice(index, 1)
      }
      message_success("删除成功！")
    }

    function handleSave(){
      // 没有验证通过返回
      if(!validation()) return;

      field_add({data:tableData.value}).then(({data})=>{
        if(data.code === 200){
          tableData.value = washTableData(data.data)
          message_success("保存成功！")
        }
      })
      console.log("handleSave")
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
      tableData,
      fieldOptions,
      handleCreate,
      handleDelete,
      handleSave,
      valid_field,
    }
  }
})
</script>

<style scoped>
/deep/ .el-table thead{
  color: #909399;
}
</style>