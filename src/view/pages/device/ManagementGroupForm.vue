<template>
<div>
  <el-row type="flex" class="px-3 pb-3">
    <el-col :span="3" class="pt-2 label-name">
      业务名
    </el-col>
    <el-col :span="10">
      <BusinessSelector
          :business_id.sync="business_id"
          :clearable="false"
          @change="handleSearch()"></BusinessSelector>
    </el-col>
    <el-col :span="11">
      <div class="text-right">
        <el-button type="indigo" size="medium" @click="handleCreate()">添加</el-button>
      </div>
    </el-col>
  </el-row>

  <el-form class="inline-edit">
  <el-table :data="tableData" fit style="width: 100%">
    <el-table-column label="组名" width="auto" min-width="40%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.name">
          <el-input size="medium" v-model="scope.row.name" @change="handleSave(scope.row)"></el-input>
        </el-form-item>
      </template>
    </el-table-column>
    <el-table-column label="上级分组" width="auto" min-width="40%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.parent_id">
          <el-select
              class="w-100"
              size="medium"
              placeholder="请选择分组设备"
              filterable
              v-model="scope.row.parent_id"
              @change="handleSave(scope.row)"
          >
            <el-option value="0" label="/"></el-option>
            <el-option
                v-for="item in deviceGroupOptions"
                :key="item.id" :value="item.id" :label="item.device_group"></el-option>

          </el-select>
        </el-form-item>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="auto" min-width="20%">
      <template v-slot="scope">
        <el-popconfirm title="确定要删除此项吗？" @confirm="handleDelete(scope.row)">
          <el-button slot="reference" type="danger" size="medium">删除</el-button>
        </el-popconfirm>
      </template>
    </el-table-column>
  </el-table>
  </el-form>

  <div class="text-right py-3">
    <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="params.current_page"
        :page-size="params.per_page"
        @change="getGroupIndex"></el-pagination>
  </div>

</div>
</template>

<script>
import {defineComponent, reactive, ref} from "@vue/composition-api";
import useRoute from "@/utils/useRoute";
import BusinessSelector from "@/components/common/BusinessSelector.vue"
import useDeviceGroup from "@/view/pages/device/useDeviceGroup";
import DeviceGroupSelector from "./DeviceGroupSelector.vue"
import useBusinessGroupIndex from "@/view/pages/device/useBusinessGroupIndex";
import useBusinessGroupCUD from "@/view/pages/device/useBusinessGroupCUD";

export default defineComponent({
  name: "ManagementGroupForm",
  components: {
    BusinessSelector,
    DeviceGroupSelector,
  },
  setup(props, context){
    let {route} = useRoute()
    let business_id = ref('')
    business_id.value = route.query.business_id

    let {
      tableData,
      params,
      total,
      getGroupIndex,
      handleSearch,
    } = useBusinessGroupIndex(business_id)

    // 设备分组下拉选项
    let {
      deviceGroupOptions,
      getGroupOptions,
    } = useDeviceGroup(business_id.value)

    function handleChange(){
      context.emit('change')
      getGroupOptions()
    }

    // 增删改
    let {
      handleCreate,
      handleDelete,
      handleSave
    }= useBusinessGroupCUD(tableData, business_id, handleChange)

    return {
      business_id,
      tableData,
      params,
      total,
      getGroupIndex,
      handleSearch,
      deviceGroupOptions,
      handleCreate,
      handleDelete,
      handleSave,
    }

  }
})
</script>

<style scoped>
/*/deep/ .el-table thead,.label-name{*/
/*  color: #a8c5ff;*/
/*}*/
</style>