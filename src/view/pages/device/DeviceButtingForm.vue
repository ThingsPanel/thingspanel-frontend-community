<template>
<div>
  <el-alert v-if="!device_item.type" title="请先选择插件" type="warning" show-icon :closable="false"></el-alert>

  <el-form class="inline-edit">
  <el-table :data="tableData" fit style="width: 100%" class="el-table-transparent">
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
              @change="valid_field(scope.row, 'field_to')"
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
    <el-button type="primary" class="w-100" size="medium" @click="handleSave()">保存</el-button>
  </div>

  <p class="label-name px-3 py-1">提示：配置错误则数据无法入库</p>
</div>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import FieldSelector from "./FieldSelector.vue"
import useDeviceButtingCUD from "@/view/pages/device/useDeviceButtingCUD";
import useDeviceFieldIndex from "@/view/pages/device/useDeviceFieldIndex";
import useDeviceFieldOptions from "@/view/pages/device/useDeviceFieldOptions";

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
    let device_id = props.device_item.id
    let device_type = props.device_item.type

    // 获取当前设备的映射列表
    let {
      tableData,
      washTableData
    } = useDeviceFieldIndex(device_id)

    // 初始化 fieldOptions
    let {
      fieldOptions
    } = useDeviceFieldOptions(tableData, device_type)

    // 增删改
    let {
      handleCreate,
      handleDelete,
      handleSave,
      valid_field,
    } = useDeviceButtingCUD(tableData, device_id, washTableData, fieldOptions)


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
/*/deep/ .el-table thead{*/
/*  color: #a8c5ff;*/
/*}*/


/deep/ .el-select-dropdown__item.selected.is-disabled{
  cursor: pointer !important;
}
</style>