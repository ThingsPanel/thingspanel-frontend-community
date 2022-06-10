<template>
<div class="rounded card p-4 el-table-transparent">
  <!-- 筛选 start -->
  <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3 el-dark-input">
    <el-col :span="4">
      <BusinessSelector
          :business_id.sync="params.business_id"
          @change="handleBusinessSelectorChange()"></BusinessSelector>
    </el-col>
    <el-col :span="4">
      <AssertSelector
          :business_id="params.business_id"
          :asset_id.sync="params.asset_id"
          @change="handleSearch()"></AssertSelector>
    </el-col>
    <el-col :span="4">
      <el-select
          placeholder="请选择设备插件"
          size="medium"
          v-model="params.device_type"
          @change="handleSearch()" clearable>
        <el-option
            v-for="item in device_plugin"
            :key="item.id"
            :label="item.name"
            :value="item.id"
        ></el-option>
      </el-select>
    </el-col>
    <el-col :span="4">
      <el-input
          placeholder="请填写要筛选的token"
          v-model="params.token"
          size="medium"
          clearable
          @keydown.enter.native="handleSearch()"
          @clear="handleSearch()"></el-input>
    </el-col>
    <el-col :span="4"></el-col>
    <el-col :span="2">
      <el-button class="w-100" type="indigo" size="medium" @click="handleSearch()">查询</el-button>
    </el-col>
    <el-col :span="2">
      <el-button class="w-100" type="default" size="medium" @click="handleReset()">重置</el-button>
    </el-col>
  </el-row>
  <!-- 筛选 end -->

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column align="center" label="业务名称" prop="business_name"></el-table-column>
    <el-table-column align="center" label="设备分组" prop="asset_name"></el-table-column>
    <el-table-column align="center" label="设备名称" prop="device_name">
      <template v-slot="scope">
        <div class="cursor-pointer" @click="handleListClick(scope.row)">
          {{scope.row.device_name}}
        </div>
      </template>
    </el-table-column>
<!--    <el-table-column label="设备ID" prop="device"></el-table-column>-->
    <el-table-column align="center" label="设备插件" prop="device_type"></el-table-column>
    <el-table-column align="center" label="token" prop="device_token">
      <template v-slot="scope">
        <span class="cursor-pointer" @click="handleSearch({token:scope.row.device_token})">{{scope.row.device_token}}</span>
      </template>
    </el-table-column>
    <el-table-column align="center" label="协议" prop="protocol"></el-table-column>
    <el-table-column align="center" label="上次推送" prop="last_ts"></el-table-column>
  </el-table>
  <!-- 表 end -->

  <!-- 分页 start -->
  <div class="text-right py-3">
    <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="params.current_page"
        :page-size="params.per_page"
        @current-change="getDeviceIndex"></el-pagination>
  </div>
  <!-- 分页 end -->

  <!-- 设备详情 start -->
  <DeviceShowDialog
      :device_id="currentDeviceId"
      :deviceShowDialogVisible.sync="deviceShowDialogVisible">
  </DeviceShowDialog>
  <!-- 设备详情 end -->

</div>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import useDeviceIndex from "@/view/pages/device/useDeviceIndex";
import BusinessSelector from "@/components/common/BusinessSelector.vue"
import AssertSelector from "@/components/common/AssertSelector.vue"
import DeviceShowDialog from "@/view/pages/device/DeviceShowDialog.vue"
import {ref} from "@vue/composition-api/dist/vue-composition-api";

export default defineComponent({
  name: "DeviceIndex",
  components: {
    BusinessSelector,
    AssertSelector,
    DeviceShowDialog,
  },
  setup(){
    let {
      tableData,
      loading,
      params,
      getDeviceIndex,
      total,
      handleSearch,
      handleReset,
      device_plugin,
    } = useDeviceIndex()

    function handleBusinessSelectorChange(){
      // business_id 更改时清空 asset_id
      params.asset_id = ""
      handleSearch()
    }

    let currentDeviceId = ref('')
    let deviceShowDialogVisible = ref(false)

    function handleListClick(item){
      currentDeviceId.value = item.device
      deviceShowDialogVisible.value = true
    }

    return {
      tableData,
      loading,
      params,
      getDeviceIndex,
      total,
      handleSearch,
      handleReset,
      device_plugin,
      handleBusinessSelectorChange,
      currentDeviceId,
      deviceShowDialogVisible,
      handleListClick,
    }
  }
})
</script>

<style scoped>

</style>