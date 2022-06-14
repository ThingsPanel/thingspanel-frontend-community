<template>
<div class="rounded card p-4 el-table-transparent el-dark-input">
  <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
    <el-col :span="17">
      <TableTitle>设备管理</TableTitle>
    </el-col>
    <el-col :span="3">
      <el-button type="indigo" size="medium" class="w-100">创建设备向导</el-button>
    </el-col>
    <el-col :span="2">
      <el-button type="indigo" size="medium" class="w-100" @click="handleCreate()">创建设备</el-button>
    </el-col>
    <el-col :span="2">
      <el-button type="indigo" size="medium" class="w-100">管理分组</el-button>
    </el-col>
  </el-row>

  <!-- 筛选 start -->
  <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
    <el-col :span="4">
      <DeviceGroupSelector
          :clearable="true"
          :business_id="params.business_id"
          :asset_id.sync="params.asset_id"
          @change="handleSearch()"></DeviceGroupSelector>
    </el-col>
    <el-col :span="4">
      <el-select
          class="w-100"
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
    <el-col :span="8"></el-col>
    <el-col :span="2">
      <el-button class="w-100" type="indigo" size="medium" @click="handleSearch()">查询</el-button>
    </el-col>
    <el-col :span="2">
      <el-button class="w-100" type="default" size="medium" @click="handleReset()">重置</el-button>
    </el-col>
  </el-row>
  <!-- 筛选 end -->

  <!-- 表 start -->
  <el-form
      ref="deviceForm"
      class="inline-edit"
      :model="formData"
      :rules="rules"
      hide-required-asterisk>
  <el-table :data="tableData" v-loading="loading">
    <el-table-column label="序号" type="index" width="50" align="center"></el-table-column>
<!--    <el-table-column align="center" label="业务名称" prop="business_name"></el-table-column>-->
    <el-table-column align="center" label="设备名称" prop="device_name">
      <template v-slot="scope">
        <el-form-item prop="name" v-if="scope.row.status">
          <el-input size="medium" v-model="formData.name" v-focus></el-input>
        </el-form-item>
        <div v-else class="cursor-pointer" @click="handleListClick(scope.row)">
          {{scope.row.device_name}}
        </div>
      </template>
    </el-table-column>
<!--    <el-table-column align="center" label="设备id" prop="device"></el-table-column>-->
    <el-table-column align="center" label="设备分组" prop="asset_name">
      <template v-slot="scope">
        <el-form-item prop="asset_id" v-if="scope.row.status">
          <DeviceGroupSelector
              :business_id="params.business_id"
              :asset_id.sync="formData.asset_id"
          ></DeviceGroupSelector>
        </el-form-item>
        <div v-else>{{scope.row.asset_name}}</div>
      </template>
    </el-table-column>
<!--    <el-table-column label="设备ID" prop="device"></el-table-column>-->
    <el-table-column align="center" label="设备插件" prop="device_type">
      <template v-slot="scope">
        <el-form-item prop="type" v-if="scope.row.status">
          <el-select
              class="w-100"
              placeholder="请选择设备插件"
              size="medium"
              v-model="formData.type"
          >
            <el-option
                v-for="item in device_plugin"
                :key="item.id"
                :label="item.name"
                :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <div v-else>{{deviceTypeMap(scope.row.device_type)}}</div>
      </template>
    </el-table-column>
<!--    <el-table-column align="center" label="token" prop="device_token">-->
<!--      <template v-slot="scope">-->
<!--        <span class="cursor-pointer" @click="handleSearch({token:scope.row.device_token})">{{scope.row.device_token}}</span>-->
<!--      </template>-->
<!--    </el-table-column>-->
<!--    <el-table-column align="center" label="协议" prop="protocol"></el-table-column>-->
    <el-table-column align="center" label="上次推送" prop="last_ts"></el-table-column>
    <el-table-column align="center" label="操作" width="145px">
      <template v-slot="scope">
        <div class="text-right">
          <template v-if="scope.row.status">
            <el-button type="indigo" size="mini" @click="handleSave(scope.row)">保存</el-button>
            <el-button type="default" size="mini" @click="handleCancel(scope.row)">取消</el-button>
          </template>
          <template v-else>
            <el-button type="indigo" size="mini" class="mr-3" @click="handleEdit(scope.row)">修改</el-button>
            <el-popconfirm title="确定要删除此项吗？" @confirm="handleDelete(scope.row)">
              <el-button slot="reference" type="danger" size="mini">删除</el-button>
            </el-popconfirm>
          </template>
        </div>
      </template>
    </el-table-column>
  </el-table>
  </el-form>
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
import DeviceGroupSelector from "@/components/common/DeviceGroupSelector.vue"
import DeviceShowDialog from "@/view/pages/device/DeviceShowDialog.vue"
import {ref} from "@vue/composition-api/dist/vue-composition-api";
import TableTitle from "@/components/common/TableTitle.vue"
import useRoute from "@/utils/useRoute";
import useDeviceCUD from "@/view/pages/device/useDeviceCUD";

export default defineComponent({
  name: "DeviceIndex",
  components: {
    DeviceGroupSelector,
    DeviceShowDialog,
    TableTitle,
  },
  setup(){
    let {route} = useRoute()
    // console.log(route.query.business_id)

    let {
      tableData,
      loading,
      params,
      getDeviceIndex,
      total,
      handleSearch,
      handleReset,
      device_plugin,
      deviceTypeMap,
    } = useDeviceIndex(route.query.business_id)

    let {
      deviceForm,
      formData,
      rules,
      handleCreate,
      handleEdit,
      handleCancel,
      handleSave,
      handleDelete,
    } = useDeviceCUD(tableData)


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
      deviceTypeMap,
      handleBusinessSelectorChange,
      currentDeviceId,
      deviceShowDialogVisible,
      handleListClick,
      deviceForm,
      formData,
      rules,
      handleCreate,
      handleEdit,
      handleCancel,
      handleSave,
      handleDelete,
    }
  }
})
</script>

<style scoped>

</style>