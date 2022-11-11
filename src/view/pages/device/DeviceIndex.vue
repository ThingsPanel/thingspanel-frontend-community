<template>
<div class="rounded card p-4 el-table-transparent">
  <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
    <el-col :span="12">
      <TableTitle>{{ $t("COMMON.DEVICE") }}</TableTitle>
    </el-col>
    <el-col :span="12" class="text-right">

      <el-button type="indigo" size="medium" @click="handleCreate()">{{ $t("COMMON.CREATEDEVICE")}}</el-button>

      <el-button type="indigo" size="medium" @click="showManagementGroup=true">{{ $t("COMMON.MANAGEMENTGROUP")}}</el-button>

<!--      <el-button type="indigo" size="medium" @click="handleDeviceChart">设备图表</el-button>-->

    </el-col>
  </el-row>

  <!-- 筛选 start -->
  <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3 el-dark-input">

    <el-col :span="5">
      <DeviceGroupSelector
          :asset_id.sync="params.asset_id"
          :options="deviceGroupOptions"
          :clearable="true"
          @change="handleSearch()"
      ></DeviceGroupSelector>
    </el-col>
    <el-col :span="5">
        <DevicePluginSelector
            :plugin_type.sync="params.device_type"
            :options="devicePluginOptions"
            :clearable="true"
            @change="handleSearch()"
        ></DevicePluginSelector>
    </el-col>
    <el-col :span="5">
      <el-input
          :placeholder="$t('COMMON.PLACEHOLDER2')"
          v-model="params.name"
          size="medium"
          clearable
          @keydown.enter.native="handleSearch()"
          @clear="handleSearch()"></el-input>
    </el-col>
    <el-col :span="9" class="text-right">
      <el-button type="indigo" size="medium" @click="handleSearch()">{{ $t("COMMON.SEARCH")}}</el-button>
<!--      <el-button type="default" size="medium" @click="handleReset()">重置</el-button>-->
    </el-col>
  </el-row>
  <!-- 筛选 end -->

  <!-- 表 start -->
  <el-form class="inline-edit el-dark-input">
  <el-table :data="tableData" v-loading="loading" default-expand-all row-key="id" fit style="width: 100%" :indent="30">

    <el-table-column :label="$t('COMMON.TYPE')" width="120">
      <template slot-scope="scope">
        {{ scope.row.device_type == 3 ? $t('COMMON.SUB_DEVICE'): (scope.row.device_type == 2 ? $t('COMMON.THEGATEWAY') : $t('COMMON.EQUIPMENT'))}}
      </template>
    </el-table-column>
    <!--  设备名 start  -->
    <el-table-column :label="$t('COMMON.DEVICENAME1')" width="200" prop="name">
      <template slot-scope="scope">
        <el-form-item :error="scope.row.errors.name">
          <el-input style="width: 100%"
             :placeholder="$t('COMMON.PLACEHOLDER2')"
              size="medium"
              v-model="scope.row.name"
              @change="handleSave(scope.row)"
          ></el-input>
        </el-form-item>
      </template>
    </el-table-column>
    <!--  设备名 end  -->

    <!--  设备分组 start  -->
    <el-table-column :label="$t('COMMON.DEVICELOCATION')" width="auto" min-width="12%">
      <template slot-scope="scope">
        <el-form-item :error="scope.row.errors.asset_id">
          <DeviceGroupSelector
              :disabled="scope.row.device_type == 3"
              :asset_id.sync="scope.row.asset_id"
              :options="deviceGroupOptions"
              @change="handleSave(scope.row)"
          ></DeviceGroupSelector>
        </el-form-item>
      </template>
    </el-table-column>
    <!--  设备分组 end  -->

    <!--  设备类型：网关/设备 start  -->
    <el-table-column :label="$t('COMMON.GATEWAYDEVICE')" width="auto" min-width="12%">
      <template slot-scope="scope">
        <el-form-item :error="scope.row.errors.device_type">
          <DeviceTypeSelector :deviceType.sync="scope.row.device_type" @change="deviceTypeChange(scope.row)"
          ></DeviceTypeSelector>
        </el-form-item>
      </template>
    </el-table-column>
    <!--  设备类型：网关/设备 end  -->

    <!--  设备插件 start  -->
<!--    <el-table-column label="设备插件" width="auto" min-width="12%">-->
<!--      <template v-slot="scope">-->
<!--        <el-form-item :error="scope.row.errors.type">-->
<!--          <DevicePluginSelector-->
<!--              :plugin_type.sync="scope.row.type"-->
<!--              :options="devicePluginOptions"-->
<!--              @change="handleDevicePluginChange(scope.row)"-->
<!--          ></DevicePluginSelector>-->
<!--        </el-form-item>-->
<!--      </template>-->
<!--    </el-table-column>-->
    <!--  设备插件 end  -->

    <!-- 绑定插件 -->
    <el-table-column :label="$t('COMMON.BINGPLUGINS')" width="auto" min-width="8%">
      <template slot-scope="scope">
        <el-button v-if="scope.row.device_type!='2'" type="text" @click="handleBindingClick(scope.row)">{{ $t("COMMON.BINGPLUGINS")}}</el-button>
      </template>
    </el-table-column>

    <!-- 编辑参数   -->
    <el-table-column :label="$t('COMMON.CODEMANAGE')" width="auto" min-width="8%">
      <template slot-scope="scope">
        <!-- 子设备 -->
        <el-button v-if="scope.row.device_type=='3'" type="text" @click="handleEditSubParameter(scope.row)">{{ $t("COMMON.EDITPARAMETERS")}}</el-button>
        <!-- 网关/设备 -->
        <el-button v-else type="text" @click="handleEditParameter(scope.row, '编辑参数')">{{ $t("COMMON.EDITPARAMETERS")}}</el-button>
      </template>
    </el-table-column>

    <!--  推送时间 start  -->
    <el-table-column :label="$t('COMMON.TITLE23')" width="auto" min-width="12%">
      <template slot-scope="scope">
        <div>{{scope.row.latest_ts ? dateFormat(scope.row.latest_ts/1000000) : ""}}</div>
      </template>
    </el-table-column>
    <!--  推送时间 end  -->

    <!-- 图表组件 start-->
    <el-table-column :label="$t('COMMON.TITLE24')" width="auto" min-width="23%">
      <template slot-scope="scope">
        <!--   structure下数组的 field属性的数组   -->
        <template v-if="scope.row.structure" v-for="item in scope.row.structure">
          <template v-if="item.field" v-for="field in item.field">
            <el-tag size="mini" class="mr-1 mb-1" :key="field.key">{{ field.name }}</el-tag>
          </template>
        </template>
      </template>
    </el-table-column>
    <!-- 图表组件 end-->

    <!--  操作 start  -->
    <el-table-column :label="$t('COMMON.OPERATION')" width="200px" min-width="12%">
      <template slot-scope="scope">
        <div class="text-right">
          <el-button style="margin-right: 10px" v-show="scope.row.device_type==2" type="primary" size="mini"
                     @click="addChildDevice(scope.row)">{{ $t("COMMON.ADDINGCHILDDEVICE")}}</el-button>
          <el-button style="margin-right: 10px" v-show="scope.row.device_type==3 && scope.row.protocol!='MQTT'" type="primary" size="mini"
                     @click="deviceConfig(scope.row)">设&nbsp;备&nbsp;配&nbsp;置</el-button>

           <el-popconfirm :title="$t('COMMON.DELETETHISITEM')" @confirm="handleDelete(scope.row)">
              <el-button slot="reference" type="danger" size="mini">{{ $t("COMMON.DELETE")}}</el-button>
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

  <!-- 插件绑定 start -->
  <PluginBinding :dialog-visible.sync="showBindingDialog" :device_item="currentDeviceItem" @submit="getDeviceIndex"></PluginBinding>

  <!-- 设备/网关参数 start -->
  <DeviceSettingForm :dialog-visible.sync="showDeviceSetting" :device_item="currentDeviceItem" @submit="getDeviceIndex"></DeviceSettingForm>
  <!-- 子设备参数 start -->
  <SubDeviceSettingForm :dialog-visible.sync="showSubDeviceSetting" :device_item="currentDeviceItem"></SubDeviceSettingForm>

  <!-- 分组管理 start -->
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :visible.sync="showManagementGroup"
      :title="$t('COMMON.MANAGINGDEVICEGROUPS')"
      width="30%"
      :close-on-click-modal="false"
      @open="showManagementGroupForm = true"
      @closed="showManagementGroupForm = false">
    <ManagementGroupForm v-if="showManagementGroupForm" @change="handleGroupChange"></ManagementGroupForm>
  </el-dialog>
  <!-- 分组管理 end -->

<!-- 设备配置 -->
  <DeviceConfigForm :dialog-visible.sync="deviceConfigVisible" :device="currentDeviceItem"
                    @submit="deviceConfigUpdate"
  ></DeviceConfigForm>

</div>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import {ref} from "@vue/composition-api/dist/vue-composition-api";

import useRoute from "@/utils/useRoute";
import {dateFormat} from "@/utils/tool";
import {message_error} from "@/utils/helpers";
import {structure_field} from "@/api/device";

import DeviceGroupSelector from "./components/DeviceGroupSelector.vue"
import DeviceTypeSelector from "./components/DeviceTypeSelector.vue"
import DevicePluginSelector from "./components/DevicePluginSelector.vue"
import TableTitle from "@/components/common/TableTitle.vue"

import useDeviceIndex from "./useDeviceIndex";
import useDeviceCUD from "@/view/pages/device/useDeviceCUD";
import useDeviceGroup from "@/view/pages/device/useDeviceGroup";

// 插件绑定
import PluginBinding from "./form/plugin/PluginBindingForm";
// 配置推送参数
import DeviceSettingForm from "./form/param/DeviceSettingForm.vue";
// 配置子设备设备地址
import SubDeviceSettingForm from "./form/param/SubDeviceSettingForm";
// 分组管理
import ManagementGroupForm from "./form/group/ManagementGroupForm.vue"
// 子设备配置
import DeviceConfigForm from "./form/config/DeviceConfigForm"
import {device_default_setting} from "../../../api/device";

export default defineComponent({
  name: "DeviceIndex",
  components: {
    PluginBinding,
    DeviceGroupSelector,
    DeviceTypeSelector,
    DevicePluginSelector,
    TableTitle,
    DeviceSettingForm,
    ManagementGroupForm,
    DeviceConfigForm,
    SubDeviceSettingForm
  },
  setup() {
    let {route, router} = useRoute()
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

    function deviceTypeChange(row) {
      if (row.device_type == "1" || row.device_type == 1) {
        row.protocol = "mqtt";
      } else {
        row.protocol = "MODBUS_TCP";
      }
      currentDeviceItem.value = row;
      console.log("deviceTypeChange", row)
      handleSave(row, () => {
        getDeviceIndex();
      });
    }


    // 编辑弹窗
    let showBindingDialog = ref(false);
    let showDeviceSetting = ref(false);
    let showSubDeviceSetting = ref(false);
    let showEditDialog = ref(false);
    let EditDialogTitle = ref("");
    let currentDeviceItem = ref({});

    // 绑定插件
    function handleBindingClick(item) {
      if (!item.name) {
        item.errors.name = "请填写设备名称!"
        message_error("请填写设备名称!")
        return
      }
      currentDeviceItem.value = JSON.parse(JSON.stringify(item))
      showBindingDialog.value = true;
    }

    // 编辑参数
    function handleEditParameter(item, title) {

      // 没id的时候不能编辑参数、对接、属性
      // 填写设备名新建设备有id
      if (!item.name) {
        item.errors.name = "请填写设备名称!"
        message_error("请填写设备名称!")
        return

      }if (!item.asset_id) {
        item.errors.asset_id = "请选择设备分组!"
        message_error("请选择设备分组!")
        return
      }
      // 对接校验，没有选择设备插件就没有可映射的选项
      if (!item.device_type) {
        item.errors.device_type = "请选择设备类型"
        message_error("请选择设备类型")
        return
      }
      currentDeviceItem.value = JSON.parse(JSON.stringify(item))
      EditDialogTitle.value = title
      showDeviceSetting.value = true;
    }

    // 编辑子设备参数
    function handleEditSubParameter(item) {
      console.log("====handleEditSubParameter", item)
      if (!item.name) {
        item.errors.name = "请输入子设备名称"
        message_error(item.errors.name)
        return;
      }
      showSubDeviceSetting.value = true;
      currentDeviceItem.value = JSON.parse(JSON.stringify(item));
    }

    // 管理分组
    let showManagementGroup = ref(false)
    let showManagementGroupForm = ref(false)

    // 分组更改
    function handleGroupChange() {
      // 重新加载分组选项
      getGroupOptions()
      // 重新加载设备，删除分组是会删除设备
      handleSearch()
    }

    // 设备插件更改
    function handleDevicePluginChange(item) {
      // 更新设备
      handleSave(item)

      // 更新图表组件
      structure_field({field: item.type}).then(({data}) => {
        if (data.code === 200 && data.data) {
          item.structure = data.data
        }
      })
    }

    /**
     * 增加子设备
     * @param item
     */
    function addChildDevice(row) {
      console.log("addChildDevice", row)
      let rowData = JSON.parse(JSON.stringify(row));
      let childDevice = {
        id: "",
        name: "",
        asset_id: row.asset_id,
        d_id: "",
        location: "",
        protocol: row.protocol,
        device_type: "3",
        parent_id: row.id,
        errors: {
          name: "",
          asset_id: "",
          type: "",
        }
      };

      if (!rowData.children) rowData.children = [];
      rowData.children .unshift(childDevice);
      let index = tableData.value.findIndex(item => item.id == rowData.id);
      tableData.value.splice(index, 1, rowData);
    }


    let deviceConfigVisible = ref(false);
    /**
     * 设备配置
     * @param item
     */
    function deviceConfig(row) {
      if (!row.name) {
        row.errors.name = "请输入子设备名称"
        message_error(row.errors.name)
        return;
      }
      currentDeviceItem.value = JSON.parse(JSON.stringify(row));
      deviceConfigVisible.value = true;
      console.log("deviceConfig", row)
      let index = tableData.value.findIndex(item => item.id == row.id);
      console.log(index)

    }

    function deviceConfigUpdate() {
      handleSearch();
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
      deviceTypeChange,
      getGroupOptions,
      showBindingDialog,
      handleBindingClick,
      showEditDialog,
      EditDialogTitle,
      showDeviceSetting,
      handleEditParameter,
      showSubDeviceSetting,
      handleEditSubParameter,
      currentDeviceItem,
      showManagementGroup,
      showManagementGroupForm,
      handleGroupChange,
      handleDevicePluginChange,
      addChildDevice,
      deviceConfigVisible,
      deviceConfig,
      deviceConfigUpdate
    }
  }
})
</script>

<style scoped>
/*/deep/ .el-form-item__content{*/
/*  line-height: 1;*/
/*}*/

/*/deep/ .el-form-item{*/
/*  margin: 0 !important;*/
/*}*/
/deep/ .el-tag {
  border: 1px solid;
  background-color: transparent;
}
</style>