<template>
<div class="rounded card p-4 el-table-transparent">
  <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
    <el-col :span="17">
      <TableTitle>设备管理</TableTitle>
    </el-col>
    <el-col :span="3">
<!--      <el-button type="indigo" size="medium" class="w-100">创建设备向导</el-button>-->
    </el-col>
    <el-col :span="4" class="text-right">
      <el-button type="indigo" size="medium" @click="handleCreate()">创建设备</el-button>

      <el-button type="indigo" size="medium" @click="showManagementGroup=true">管理分组</el-button>
    </el-col>
  </el-row>

  <!-- 筛选 start -->
  <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3 el-dark-input">
    <el-col :span="4">
      <DeviceGroupSelector
          :asset_id.sync="params.asset_id"
          :options="deviceGroupOptions"
          :clearable="true"
          @change="handleSearch()"
      ></DeviceGroupSelector>
    </el-col>
    <el-col :span="4">
        <DevicePluginSelector
            :plugin_type.sync="params.device_type"
            :options="devicePluginOptions"
            :clearable="true"
            @change="handleSearch()"
        ></DevicePluginSelector>
    </el-col>
    <el-col :span="4">
      <el-input
          placeholder="请输入设备名"
          v-model="params.name"
          size="medium"
          clearable
          @keydown.enter.native="handleSearch()"
          @clear="handleSearch()"></el-input>
    </el-col>
    <el-col :span="8"></el-col>
    <el-col :span="4" class="text-right">
      <el-button type="indigo" size="medium" @click="handleSearch()">查询</el-button>
      <el-button type="default" size="medium" @click="handleReset()">重置</el-button>
    </el-col>
  </el-row>
  <!-- 筛选 end -->

  <!-- 表 start -->
  <el-form class="inline-edit el-dark-input">
  <el-table :data="tableData" v-loading="loading" fit style="width: 100%">
<!--    <el-table-column label="序号" type="index" width="50"></el-table-column>-->

    <!--  设备名 start  -->
    <el-table-column label="设备名称" width="auto" min-width="12%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.name">
          <el-input
              size="medium"
              v-model="scope.row.name"
              @change="handleSave(scope.row)"
          ></el-input>
        </el-form-item>
      </template>
    </el-table-column>
    <!--  设备名 end  -->

    <!--  设备分组 start  -->
    <el-table-column label="设备分组" width="auto" min-width="12%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.asset_id">
          <DeviceGroupSelector
              :asset_id.sync="scope.row.asset_id"
              :options="deviceGroupOptions"
              @change="handleSave(scope.row)"
          ></DeviceGroupSelector>
        </el-form-item>
      </template>
    </el-table-column>
    <!--  设备分组 end  -->

    <!--  设备插件 start  -->
    <el-table-column label="设备插件" width="auto" min-width="12%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.type">
          <DevicePluginSelector
              :plugin_type.sync="scope.row.type"
              :options="devicePluginOptions"
              @change="handleSave(scope.row)"
          ></DevicePluginSelector>
        </el-form-item>
      </template>
    </el-table-column>
    <!--  设备插件 end  -->

    <el-table-column label="推送参数" width="auto" min-width="8%">
      <template v-slot="scope">
        <el-button type="text" @click="handleEditClick(scope.row, '编辑参数')">编辑参数</el-button>
      </template>
    </el-table-column>

    <el-table-column label="数据对接" width="auto" min-width="8%">
      <template v-slot="scope">
        <el-button type="text" @click="handleEditClick(scope.row, '编辑对接')">编辑对接</el-button>
      </template>
    </el-table-column>

    <el-table-column label="设备属性" width="auto" min-width="8%">
      <template v-slot="scope">
        <el-button type="text" @click="handleEditClick(scope.row, '编辑属性')">编辑属性</el-button>
      </template>
    </el-table-column>

    <!--  推送时间 start  -->
    <el-table-column label="上次推送" width="auto" min-width="12%">
      <template v-slot="scope">
        <div>{{scope.row.latest_ts ? dateFormat(scope.row.latest_ts/1000000) : ""}}</div>
      </template>
    </el-table-column>
    <!--  推送时间 end  -->

    <!-- 图表组件 start-->
<!--    <el-table-column label="图表组件" width="auto" min-width="23%">-->
<!--      <template v-slot="scope">-->
<!--        <el-tag size="mini" class="mr-1 mb-1">温湿度传感器</el-tag>-->
<!--        <el-tag size="mini">温湿度传感器</el-tag>-->
<!--      </template>-->
<!--    </el-table-column>-->
    <!-- 图表组件 end-->

    <!--  操作 start  -->
    <el-table-column label="操作" width="auto" min-width="5%">
      <template v-slot="scope">
<!--        <div class="text-right">-->
           <el-popconfirm title="确定要删除此项吗？" @confirm="handleDelete(scope.row)">
              <el-button slot="reference" type="danger" size="mini">删除</el-button>
           </el-popconfirm>
<!--        </div>-->
      </template>
    </el-table-column>
    <!--  操作 end  -->

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

  <!-- 编辑弹窗 start -->
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :visible.sync="showEditDialog"
      :title="EditDialogTitle"
      width="30%">
    <!--  默认参数  -->
    <DeviceSettingForm
        v-if="EditDialogTitle === '编辑参数'"
        :device_item="currentDeviceItem"
        :key="currentDeviceItem.id"
        @change="handleSave(currentDeviceItem)"
    ></DeviceSettingForm>

    <!--  属性  -->
    <DeviceAttributeForm
        v-else-if="EditDialogTitle === '编辑属性'"
        :device_item="currentDeviceItem"
        :key="currentDeviceItem.id"
        @change="handleSave(currentDeviceItem)"
    ></DeviceAttributeForm>

    <!--  对接  -->
    <DeviceButtingForm
        v-else-if="EditDialogTitle === '编辑对接'"
        :device_item="currentDeviceItem"
        :key="currentDeviceItem.id"
        @change="handleSave(currentDeviceItem)"
    ></DeviceButtingForm>

  </el-dialog>
  <!-- 编辑弹窗 end -->

  <!-- 分组管理 start -->
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :visible.sync="showManagementGroup"
      title="管理设备分组"
      width="30%" destroy-on-close>
    <ManagementGroupForm @change="handleChange"></ManagementGroupForm>
  </el-dialog>
  <!-- 分组管理 end -->

</div>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import useDeviceIndex from "@/view/pages/device/useDeviceIndex";
import DeviceGroupSelector from "./DeviceGroupSelector.vue"
import DevicePluginSelector from "./DevicePluginSelector.vue"
import DeviceShowDialog from "@/view/pages/device/DeviceShowDialog.vue"
import {ref} from "@vue/composition-api/dist/vue-composition-api";
import TableTitle from "@/components/common/TableTitle.vue"
import useRoute from "@/utils/useRoute";
import useDeviceCUD from "@/view/pages/device/useDeviceCUD";
import {dateFormat} from "@/utils/tool";
import useDeviceGroup from "@/view/pages/device/useDeviceGroup";
import DeviceSettingForm from "@/view/pages/device/DeviceSettingForm.vue";
import DeviceAttributeForm from "@/view/pages/device/DeviceAttributeForm.vue";
import DeviceButtingForm from "@/view/pages/device/DeviceButtingForm.vue";
import ManagementGroupForm from "./ManagementGroupForm.vue"
import {message_error} from "@/utils/helpers";

export default defineComponent({
  name: "DeviceIndex",
  components: {
    DeviceGroupSelector,
    DevicePluginSelector,
    DeviceShowDialog,
    TableTitle,
    DeviceSettingForm,
    DeviceAttributeForm,
    DeviceButtingForm,
    ManagementGroupForm,
  },
  setup(){
    let {route} = useRoute()
    // console.log(route.query.business_id)

    let business_id = route.query.business_id

    // 设备分组的选项
    let {
      deviceGroupOptions,
      getGroupOptions,
    } = useDeviceGroup(business_id)

    // 设备列表
    let {
      tableData,
      loading,
      params,
      getDeviceIndex,
      total,
      handleSearch,
      handleReset,
      devicePluginOptions,
      deviceTypeMap,
    } = useDeviceIndex(business_id)

    // 设备的增删改
    let {
      handleCreate,
      handleSave,
      handleDelete,
    } = useDeviceCUD(tableData)

    // 编辑弹窗
    let showEditDialog = ref(false)
    let EditDialogTitle = ref("")
    let currentDeviceItem = ref({})

    // 编辑参数 编辑对接 编辑属性
    function handleEditClick(item, title){
      if(!item.id) {
        item.errors.name = "请先填写设备名称"
        message_error("请先填写设备名称")
        return
      }
      currentDeviceItem.value = item
      EditDialogTitle.value = title
      showEditDialog.value = true;
    }

    // 管理分组
    let showManagementGroup = ref(false)

    // 分组更改
    function handleChange(){
      // 重新加载分组选项
      getGroupOptions()
      // 重新加载设备，删除分组是会删除设备
      handleSearch()
    }

    return {
      tableData,
      loading,
      params,
      getDeviceIndex,
      total,
      handleSearch,
      handleReset,
      devicePluginOptions,
      deviceTypeMap,
      handleCreate,
      handleSave,
      handleDelete,
      dateFormat,
      deviceGroupOptions,
      getGroupOptions,
      showEditDialog,
      EditDialogTitle,
      handleEditClick,
      currentDeviceItem,
      showManagementGroup,
      handleChange,
    }
  }
})
</script>

<style scoped>
/deep/ .el-form-item__content{
  line-height: 1;
}

/deep/ .el-form-item{
  margin: 0 !important;
}
</style>