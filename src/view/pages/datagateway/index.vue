<template>
  <div class="rounded p-4 card">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{
          $t("RULE_ENGINE.DATA_GATEWAY.DATA_GATEWAY")
        }}</TableTitle>
      </el-col>
      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="border" @click="handleCreate">{{
          $t("RULE_ENGINE.DATA_GATEWAY.CREATE")
        }}</el-button>
      </el-col>
    </el-row>

    <el-row style="margin-bottom: 5px">
      <el-col :span="6">
        <el-input :placeholder="$t('RULE_ENGINE.DATA_GATEWAY.NAME')" size="medium" v-model="searchName" clearable
          @input="handleSearch">
        </el-input>
      </el-col>
    </el-row>

    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label="$t('RULE_ENGINE.DATA_GATEWAY.NAME')" prop="name" min-width="150"></el-table-column>
      <el-table-column prop="app_key" :label="$t('RULE_ENGINE.DATA_GATEWAY.APP_KEY')" min-width="120" v-slot="scope">
        <el-row type="flex" justify="end">
          <el-col>
            <i class="el-icon-document-copy" style="margin-right: 5px; cursor: pointer"
              v-clipboard:copy="scope.row.app_key" v-clipboard:success="handleCopy"></i>
            <el-tooltip class="item" effect="dark" :content="scope.row.app_key" placement="top-start">
              <span>{{
                scope.row.app_key ? scope.row.app_key.substr(0, 5) + "..." : ""
              }}</span>
            </el-tooltip>
          </el-col>
        </el-row>
      </el-table-column>
      <el-table-column prop="signature_mode" :label="$t('RULE_ENGINE.DATA_GATEWAY.SIGNATURE_MODE')"
        width="90"></el-table-column>
      <el-table-column prop="ip_whitelist" :label="$t('RULE_ENGINE.DATA_GATEWAY.IP_WHITELIST')" v-slot="scope" min-width="110">
        <el-tooltip class="item" effect="dark" :content="scope.row.ip_whitelist" placement="top-start" width="110">
          <span>{{
            scope.row.ip_whitelist && scope.row.ip_whitelist.length > 24
            ? scope.row.ip_whitelist.substr(0, 24) + "..."
            : scope.row.ip_whitelist
          }}</span>
        </el-tooltip>
      </el-table-column>
      <el-table-column prop="device_access_scope" :label="$t('RULE_ENGINE.DATA_GATEWAY.DEVICE_ACCESS_SCOPE')" :span="12"
        min-width="125" v-slot="scope">
        <span v-if="scope.row.device_access_scope == '1'">{{
          $t("RULE_ENGINE.DATA_GATEWAY.ALL")
        }}</span>
        <span v-else-if="scope.row.device_access_scope == '2'">{{
          $t("RULE_ENGINE.DATA_GATEWAY.PART")
        }}</span>
        <span v-else>error</span>
        <el-button size="mini" :type="scope.row.device_access_scope != '1' ? 'success' : 'info'" style="margin-left: 10px"
          :disabled="scope.row.device_access_scope == '1'" @click="handleShowDeviceDialog(scope.row)">{{
            $t("RULE_ENGINE.DATA_GATEWAY.CHOOSE") }}</el-button></el-table-column>
      <el-table-column prop="api_access_scope" :label="$t('RULE_ENGINE.DATA_GATEWAY.API_ACCESS_SCOPE')" min-width="125"
        v-slot="scope">
        <span v-if="scope.row.api_access_scope == '1'">{{
          $t("RULE_ENGINE.DATA_GATEWAY.ALL")
        }}</span>
        <span v-else-if="scope.row.api_access_scope == '2'">{{
          $t("RULE_ENGINE.DATA_GATEWAY.PART")
        }}</span>
        <span v-else>error</span>
        <el-button size="mini" :type="scope.row.api_access_scope != '1' ? 'success' : 'info'" style="margin-left: 10px"
          :disabled="scope.row.api_access_scope == '1'" @click="handleShowApiDialog(scope.row)">{{
            $t("RULE_ENGINE.DATA_GATEWAY.CHOOSE") }}</el-button>
      </el-table-column>
      <el-table-column prop="description"
        :label="$t('RULE_ENGINE.DATA_GATEWAY.DESCRIPTION')"></el-table-column>
      <el-table-column prop="created_at" :label="$t('RULE_ENGINE.DATA_GATEWAY.CREATED_AT')" width="145">
        <template v-slot="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="actions" :label="$t('RULE_ENGINE.DATA_GATEWAY.OPERATION')" align="left" width="245px">
        <template v-slot="scope">
          <el-button size="mini" type="indigo" @click="handleShowKey(scope.row)">{{
            $t("RULE_ENGINE.DATA_GATEWAY.VIEW_KEY") }}</el-button>
          <el-button class="mr-3" size="mini" type="indigo" @click="handleShowEdit(scope.row)">{{
            $t("RULE_ENGINE.DATA_GATEWAY.EDIT") }}</el-button>

          <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')" class="mr-1" :title="$t('AUTOMATION.TITLE4')" @confirm="handle_del(scope.row.id)">
            <el-button slot="reference" class="mr-3" size="mini" type="danger">{{ $t("RULE_ENGINE.DATA_GATEWAY.DELETE")
            }}</el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
      
      <template #empty>
        <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
      </template>
    </el-table>

    <div class="text-right py-3">
      <el-pagination background layout="prev, pager, next" :total="data_count" :current-page.sync="page"
        :page-size="per_page" @current-change="page_change"></el-pagination>
    </div>

    <CreateForm :visible.sync="dataGatewayDialogVisible" :data="formData" :id="formId" @submit="get_data" />

    <ApiAccessScopeForm :visible.sync="apiDialogVisible" :data="formData" :id="formId" @submit="get_data" />

    <DeviceAccessScopeForm :visible.sync="deviceDialogVisible" :data="formData" :id="formId" :loading="loading"
      @submit="get_data" />

    <el-dialog :visible="viewKeyDialogVisible" width="35%" height="60%" :title="$t('RULE_ENGINE.DATA_GATEWAY.VIEW_KEY')"
      :before-close="handleCloseViewKey">
      <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
        <el-col :span="3">
          {{ $t("RULE_ENGINE.DATA_GATEWAY.SECRET_KEY") }}:
        </el-col>
        <el-col :span="18">
          {{ this.viewSecretKey }}
        </el-col>
        <el-col :span="3">
          <el-button size="mini" type="success" width="30px" v-clipboard:copy="viewSecretKey"
            v-clipboard:success="handleCopy">{{ $t("RULE_ENGINE.DATA_GATEWAY.COPY") }}</el-button>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script>
import ApiAccessScopeForm from "@/view/pages/datagateway/ApiAccessScopeForm.vue";
import DeviceAccessScopeForm from "@/view/pages/datagateway/DeviceAccessScopeForm.vue";
import CreateForm from "@/view/pages/datagateway/CreateForm.vue";
import TableTitle from "@/components/common/TableTitle.vue";
import {
  getOpenApiPermissionList,
  deleteOpenApiPermission,
} from "@/api/dataGateway";
import "@/core/mixins/common";
export default {
  name: "DataGateway",
  components: {
    CreateForm,
    TableTitle,
    ApiAccessScopeForm,
    DeviceAccessScopeForm,
  },
  data: () => ({
    dataGatewayDialogVisible: false,
    apiDialogVisible: false,
    deviceDialogVisible: false,
    viewKeyDialogVisible: false,
    viewAppKey: null,
    viewSecretKey: null,
    searchName: "",
    formId: "",
    formData: null,
    loading: false,
    per_page: 5,
    page: 1,
    data_count: 2,
    tableData: [],
  }),
  created() {
    this.get_data();
  },
  methods: {
    get_data() {
      let page = {
        current_page: this.page,
        per_page: this.per_page,
      };
      getOpenApiPermissionList(page).then((res) => {
        if (res.data.code == 200) {
          this.tableData = res.data.data.data;
          this.data_count = res.data.data.total;
          this.loading = false;
        }
      });
    },
    page_change(val) {
      if (this.loading) return;
      this.loading = true;
      this.page = val;
      this.get_data();
    },

    handleCopy() {
      this.$message.success("复制成功！");
    },

    //删除
    handle_del(id) {
      deleteOpenApiPermission({ id }).then((res) => {
        if (res.data.code === 200) {
          this.get_data();
          this.$message({ message: "删除成功", center: true, type: "success" });
        }
      });
    },

    //查询
    handleSearch(val) {
      this.page = 1;

      let params = {
        current_page: this.page,
        per_page: this.per_page,
        name: val,
      };
      getOpenApiPermissionList(params).then((res) => {
        if (res.data.code == 200) {
          this.tableData = res.data.data.data;
          this.data_count = res.data.data.total;
          this.loading = false;
        }
      });
    },

    //新建弹框
    handleCreate() {
      this.formId = "";
      this.dataGatewayDialogVisible = true;
    },
    //展示秘钥
    handleShowKey(val) {
      this.viewKeyDialogVisible = true;
      this.viewAppKey = val.app_key;
      this.viewSecretKey = val.secret_key;
    },
    //关闭秘钥
    handleCloseViewKey() {
      this.viewKeyDialogVisible = false;
      this.viewAppKey = "";
      this.viewSecretKey = "";
    },
    //编辑弹框
    handleShowEdit(item) {
      this.formId = item.id;
      this.formData = item;
      this.dataGatewayDialogVisible = true;
    },
    //编辑接口访问范围对话框
    handleShowApiDialog(item) {
      this.formId = item.id;
      this.formData = item;
      this.apiDialogVisible = true;
    },
    //编辑设备访问范围对话框
    handleShowDeviceDialog(item) {
      this.formId = item.id;
      this.formData = item;
      this.deviceDialogVisible = true;
    },
  },
};
</script>

<style scoped></style>
