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
      <el-select
          class="w-100"
          size="medium"
          placeholder="请选择设备分组"
          v-model="params.asset_id"
          filterable
          clearable
          @change="handleSearch()"
      >
        <el-option
            :value="item.id"
            :label="item.device_group"
            v-for="item in deviceGroupOptions"></el-option>
      </el-select>
    </el-col>
    <el-col :span="4">
      <el-select
          class="w-100"
          placeholder="请选择设备插件"
          size="medium"
          v-model="params.device_type"
          filterable
          clearable
          @change="handleSearch()"
      >
        <el-option
            v-for="item in devicePluginOptions"
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
  <el-form class="inline-edit">
  <el-table :data="tableData" v-loading="loading" fit style="width: 100%">
<!--    <el-table-column label="序号" type="index" width="50" align="center"></el-table-column>-->

    <!--  设备名 start  -->
    <el-table-column align="center" label="设备名称" width="auto" min-width="20%">
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
    <el-table-column align="center" label="设备分组" width="auto" min-width="20%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.asset_id">
          <el-select
              class="w-100"
              size="medium"
              placeholder="请选择设备分组"
              v-model="scope.row.asset_id"
              filterable
              @change="handleSave(scope.row)"
          >
            <el-option
                :value="item.id"
                :label="item.device_group"
                v-for="item in deviceGroupOptions"></el-option>
          </el-select>
        </el-form-item>
      </template>
    </el-table-column>
    <!--  设备分组 end  -->

    <!--  设备插件 start  -->
    <el-table-column align="center" label="设备插件" width="auto" min-width="20%">
      <template v-slot="scope">
        <el-form-item :error="scope.row.errors.type">
          <el-select
              class="w-100"
              placeholder="请选择设备插件"
              size="medium"
              v-model="scope.row.type"
              filterable
              @change="handleSave(scope.row)"
          >
            <el-option
                v-for="item in devicePluginOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </template>
    </el-table-column>
    <!--  设备插件 end  -->

    <el-table-column align="center" label="推送参数" width="auto" min-width="8%">
      <template v-slot="scope">
        编辑参数
      </template>
    </el-table-column>

    <el-table-column align="center" label="数据对接" width="auto" min-width="8%">
      <template v-slot="scope">
        编辑对接
      </template>
    </el-table-column>

    <el-table-column align="center" label="设备属性" width="auto" min-width="8%">
      <template v-slot="scope">
        编辑属性
      </template>
    </el-table-column>

    <!--  推送时间 start  -->
    <el-table-column align="center" label="上次推送" width="auto" min-width="11%">
      <template v-slot="scope">
        <div>{{scope.row.latest_ts ? dateFormat(scope.row.latest_ts/1000000) : ""}}</div>
      </template>
    </el-table-column>
    <!--  推送时间 end  -->

    <!--  操作 start  -->
    <el-table-column align="center" label="操作" width="auto" min-width="5%">
      <template v-slot="scope">
        <div class="text-right">
           <el-popconfirm title="确定要删除此项吗？" @confirm="handleDelete(scope.row)">
              <el-button slot="reference" type="danger" size="mini">删除</el-button>
           </el-popconfirm>
        </div>
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
import {dateFormat} from "@/utils/tool";
import useDeviceGroup from "@/view/pages/device/useDeviceGroup";

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

    let business_id = route.query.business_id

    let {
      deviceGroupOptions,
      getGroupOptions,
    } = useDeviceGroup(business_id)

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

    let {
      handleCreate,
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
      devicePluginOptions,
      deviceTypeMap,
      handleBusinessSelectorChange,
      currentDeviceId,
      deviceShowDialogVisible,
      handleListClick,
      handleCreate,
      handleSave,
      handleDelete,
      dateFormat,
      deviceGroupOptions,
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