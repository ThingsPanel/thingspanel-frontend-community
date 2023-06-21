<!-- 管理设备分组 -->
<template>
<div>
  <el-row type="flex" class="px-3 pb-3">
    <el-col :span="5" class="pt-2 label-name">
      {{ $t('DEVICE_MANAGEMENT.MANAGEMENT_GROUP_MODEL.BUSINESSNAME') }}
    </el-col>
    <el-col :span="10">
      <BusinessSelector
          :business_id.sync="business_id"
          :clearable="false"
          @change="handleSearch()"></BusinessSelector>
    </el-col>
    <el-col :span="11">
      <div class="text-right">
        <el-button type="indigo" size="medium" @click="handleCreate()">{{ $t('DEVICE_MANAGEMENT.MANAGEMENT_GROUP_MODEL.ADD') }}</el-button>
      </div>
    </el-col>
  </el-row>

  <el-form class="inline-edit">
  <el-table :data="tableData" fit style="width: 100%">
    <el-table-column :label="$t('DEVICE_MANAGEMENT.MANAGEMENT_GROUP_MODEL.GROUPNAME')" width="auto" min-width="40%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.name">
          <el-input size="medium" v-model="scope.row.name" @change="handleSave(scope.row)"></el-input>
        </el-form-item>
      </template>
    </el-table-column>
    <el-table-column :label="$t('DEVICE_MANAGEMENT.MANAGEMENT_GROUP_MODEL.PARENTGROUP')" width="auto" min-width="40%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.parent_id">
          <el-select
              class="w-100"
              size="medium"
              :placeholder="$t('DEVICE_MANAGEMENT.MANAGEMENT_GROUP_MODEL.PLACEHOLDER')"
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
    <el-table-column :label="$t('DEVICE_MANAGEMENT.MANAGEMENT_GROUP_MODEL.THESORTING')" width="auto" min-width="10%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.sort">
          <el-input size="medium" v-model="scope.row.sort" @change="handleSave(scope.row)"></el-input>
        </el-form-item>
      </template>
    </el-table-column>
    <el-table-column :label="$t('DEVICE_MANAGEMENT.MANAGEMENT_GROUP_MODEL.OPERATION')" width="auto" min-width="10%">
      <template v-slot="scope">
        <el-popconfirm :title="$t('DEVICE_MANAGEMENT.MANAGEMENT_GROUP_MODEL.DELETETHISITEM')" @confirm="handleDelete(scope.row)">
          <el-button slot="reference" type="danger" size="medium">{{ $t('DEVICE_MANAGEMENT.MANAGEMENT_GROUP_MODEL.DELETE') }}</el-button>
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
import DeviceGroupSelector from "../../components/DeviceGroupSelector.vue"
import useBusinessGroupIndex from "./useBusinessGroupIndex";
import useBusinessGroupCUD from "./useBusinessGroupCUD";

/**
 * 分组管理
  */
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
      getGroupOptions();
      getGroupIndex();
    }

    // 增删改
    let {
      handleCreate,
      handleDelete,
      handleSave
    }= useBusinessGroupCUD(tableData, business_id, handleChange, deviceGroupOptions)

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