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

    <el-table :data="tableData" v-loading="loading">
      <el-table-column
        :label="$t('RULE_ENGINE.DATA_GATEWAY.NAME')"
        prop="name"
      ></el-table-column>
      <el-table-column
        prop="app_key"
        :label="$t('RULE_ENGINE.DATA_GATEWAY.APP_KEY')"
        width="170px"
        v-slot="scope"
      >
        <el-row type="flex" justify="end">
          <el-col>
            {{ scope.row.app_key }}
          </el-col>
          <el-col>
            <el-button
              size="mini"
              type="success"
              style=""
              v-clipboard:copy="scope.row.app_key"
              >{{ $t("RULE_ENGINE.DATA_GATEWAY.COPY") }}</el-button
            >
          </el-col>
        </el-row>
      </el-table-column>
      <el-table-column
        prop="signature_mode"
        :label="$t('RULE_ENGINE.DATA_GATEWAY.SIGNATURE_MODE')"
      ></el-table-column>
      <el-table-column
        prop="ip_whitelist"
        :label="$t('RULE_ENGINE.DATA_GATEWAY.IP_WHITELIST')"
      ></el-table-column>
      <el-table-column
        prop="device_access_scope"
        :label="$t('RULE_ENGINE.DATA_GATEWAY.DEVICE_ACCESS_SCOPE')"
        :span="12"
        v-slot="scope"
      >
        <span v-if="scope.row.device_access_scope == 1">{{
          $t("RULE_ENGINE.DATA_GATEWAY.ALL")
        }}</span>
        <span v-else-if="scope.row.device_access_scope == 2">{{
          $t("RULE_ENGINE.DATA_GATEWAY.PART")
        }}</span>
        <span v-else>error</span>
        <el-button
          size="mini"
          type="success"
          style="margin-left: 10px"
          :disabled="scope.row.device_access_scope == 1"
          @click="handleShowDeviceDialog(scope.row)"
          >{{ $t("RULE_ENGINE.DATA_GATEWAY.CHOOSE") }}</el-button
        ></el-table-column
      >
      <el-table-column
        prop="api_access_scope"
        :label="$t('RULE_ENGINE.DATA_GATEWAY.API_ACCESS_SCOPE')"
        width="120px"
        v-slot="scope"
      >
        <span v-if="scope.row.api_access_scope == 1">{{
          $t("RULE_ENGINE.DATA_GATEWAY.ALL")
        }}</span>
        <span v-else-if="scope.row.api_access_scope == 2">{{
          $t("RULE_ENGINE.DATA_GATEWAY.PART")
        }}</span>
        <span v-else>error</span>
        <el-button
          size="mini"
          type="success"
          style="margin-left: 10px"
          :disabled="scope.row.api_access_scope == 1"
          @click="handleShowApiDialog(scope.row)"
          >{{ $t("RULE_ENGINE.DATA_GATEWAY.CHOOSE") }}</el-button
        >
      </el-table-column>
      <el-table-column
        prop="description"
        :label="$t('RULE_ENGINE.DATA_GATEWAY.DESCRIPTION')"
      ></el-table-column>
      <el-table-column
        prop="created_at"
        :label="$t('RULE_ENGINE.DATA_GATEWAY.CREATED_AT')"
      >
        <template v-slot="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="actions"
        :label="$t('RULE_ENGINE.DATA_GATEWAY.OPERATION')"
        align="left"
        width="320px"
      >
        <template v-slot="scope">
          <el-button
            size="mini"
            type="indigo"
            @click="handleSetStatus(scope.row)"
            >{{ $t("RULE_ENGINE.DATA_GATEWAY.VIEW_KEY") }}</el-button
          >
          <el-button
            class="mr-3"
            size="mini"
            type="indigo"
            @click="handleShowEdit(scope.row)"
            >{{ $t("RULE_ENGINE.DATA_GATEWAY.EDIT") }}</el-button
          >

          <el-popconfirm
            class="mr-1"
            :title="$t('AUTOMATION.TITLE4')"
            @confirm="handleDelete(scope.row)"
          >
            <el-button
              slot="reference"
              class="mr-3"
              size="mini"
              type="danger"
              >{{ $t("RULE_ENGINE.DATA_GATEWAY.DELETE") }}</el-button
            >
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="text-right py-3">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="data_count"
        :current-page.sync="page"
        :page-size="per_page"
        @current-change="page_change"
      ></el-pagination>
    </div>

    <CreateForm
      :visible.sync="dataGatewayDialogVisible"
      :data="formData"
      :id="formId"
      @submit="get_data"
    />

    <ApiAccessScopeForm
      :visible.sync="apiDialogVisible"
      :data="formData"
      :id="formId"
      @submit="get_data"
    />

    <DeviceAccessScopeForm
      :visible.sync="deviceDialogVisible"
      :data="formData"
      :id="formId"
      @submit="get_data"
    />
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
    formId: "",
    formData: null,
    loading: false,
    per_page: 10,
    page: 1,
    data_count: 2,
    tableData: [
      {
        id: "111",
        name: "11bbb",
        app_key: "1132245",
        signature_mode: "MD5",
        ip_whitelist: "11.12.23.12|33.33.33.33",
        device_access_scope: 2,
        api_access_scope: 1,
        created_at: 1687325491,
        tenant_id: "b9ccb761",
        description: "1111b9ccb7612222",
      },
      {
        id: "3123124",
        name: "b1241241241bb",
        app_key: "32ssssssssss45",
        signature_mode: "AES-256",
        ip_whitelist: "10.12.23.12|33.33.33.33",
        device_access_scope: 1,
        api_access_scope: 2,
        created_at: 1687325491,
        tenant_id: "b9ccb761",
        description: "b9ccb7612222",
      },
    ],
  }),
  created() {
    this.get_data();
  },
  methods: {
    get_data() {
      let page = {
        current_page: this.page,
        per_page: 10,
      };
      getOpenApiPermissionList(page).then((res) => {
        console.log(res);
        if (res.code == 200) {
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

    //删除
    handle_del(id) {
      deleteOpenApiPermission({ data_transpond_id: id }).then((res) => {
        if (res.data.code === 200) {
          this.get_data();
          this.$message({ message: "删除成功", center: true, type: "success" });
        }
      });
    },

    //新建弹框
    handleCreate() {
      this.formId = "";
      this.dataGatewayDialogVisible = true;
      console.log(this);
    },
    //编辑弹框
    handleShowEdit(item) {
      this.formId = item.id;
      this.formData = item;
      this.dataGatewayDialogVisible = true;
      console.log(this);
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
