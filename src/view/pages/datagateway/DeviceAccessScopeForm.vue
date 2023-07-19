<template>
  <el-dialog
    class="el-dark-dialog"
    :close-on-click-modal="false"
    :before-close="handleClose"
    :visible.sync="apiDialogVisible"
    width="40%"
    height="60%"
    top="10vh"
  >
    <div class="rounded p-4 card">
      <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
        <el-col :span="24">
          <el-select
            style="width: 20%"
            class="el-dark-input"
            placeholder="未添加"
          >
            <!-- <el-option
              class="el-dark"
              value="-1"
              style="display: none;"
            ></el-option>
            <el-option
              class="el-dark"
              v-for="item in deviceAccessScopeChoice"
              :key="item.value"
              :label="item.name"
              :value="item.value"
            ></el-option> -->
          </el-select>

          <el-select
            v-model="project_choice"
            style="width: 20%"
            class="el-dark-input"
            placeholder="全部项目"
          >
            <el-option class="el-dark" value="智慧农业"></el-option>
            <!-- <el-option
              class="el-dark"
              v-for="item in deviceAccessScopeChoice"
              :key="item.value"
              :label="item.name"
              :value="item.value"
            ></el-option> -->
          </el-select>

          <el-select
            style="width: 20%"
            class="el-dark-input"
            placeholder="全部分组"
          >
            <!-- <el-option
              class="el-dark"
              v-for="item in deviceAccessScopeChoice"
              :key="item.value"
              :label="item.name"
              :value="item.value"
            ></el-option> -->
          </el-select>
        </el-col>
      </el-row>

      <el-table :data="displayData" v-loading="loading">
        <el-table-column
          :label="$t('RULE_ENGINE.DATA_GATEWAY.DEVICE_NAME')"
          prop="device_name"
        ></el-table-column>

        <el-table-column
          :label="$t('RULE_ENGINE.DATA_GATEWAY.PROJECT_NAME')"
          prop="project_name"
        ></el-table-column>

        <el-table-column
          :label="$t('RULE_ENGINE.DATA_GATEWAY.GROUP_NAME')"
          prop="group_name"
        ></el-table-column>

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
              >{{ $t("RULE_ENGINE.DATA_GATEWAY.ADD") }}</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="text-right py-3">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="data_count"
          :current-page.sync="page"
          :page-size="page_size"
          @current-change="page_change"
        ></el-pagination>
      </div>

      <div>
        <el-button size="mini" type="indigo" @click="handleClose">{{
          $t("RULE_ENGINE.DATA_GATEWAY.CLOSE")
        }}</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "DeviceAccessScopeForm",
  props: {
    id: { default: null },
    data: { default: null },
    visible: {
      type: [Boolean],
      default: false,
    },
  },
  computed: {
    apiDialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
  watch: {
    filteredData() {
      this.displayData = this.filteredData.slice(
        (this.page - 1) * this.page_size,
        this.page * this.page_size
      );
    },
    project_choice() {
      let data = this.filteredData;
      if (this.project_choice) {
        data = data.filter((item) => item.project_name == this.project_choice);
      }
      this.page = 1;
      this.filteredData = data;
      this.data_count = data.length;
    },
    visible: {
      handler(newValue) {
        if (newValue && this.id) {
          this.page = 1;
          this.get_device_data();
          this.filteredData = this.listData;
          this.data_count = this.listData.length;
        }
      },
    },
  },
  data: () => ({
    // 签名方式选项
    signMethodChoice: ["MD5", "AES-256"],
    // 接口访问范围选项
    apiAccessScopeChoice: [
      { name: "全部", value: 1 },
      { name: "部分", value: 2 },
    ],
    // 设备访问范围选项
    deviceAccessScopeChoice: [
      { name: "全部", value: 1 },
      { name: "部分", value: 2 },
    ],
    // 列表数据
    listData: [],
    filteredData: [],
    displayData: [],
    page: 0,
    page_size: 5,
    data_count: 0,
    project_choice: "",
    form: {
      id: "",
      name: "",
      app_key: "",
      signature_mode: "",
      ip_whitelist: "",
      device_access_scope: 0,
      api_access_scope: 0,
      created_at: 0,
      tenant_id: "",
      description: "",
    },
  }),
  methods: {
    get_device_data() {
      this.listData = [
        {
          device_name: "温湿度1",
          project_name: "智慧农业",
          group_name: "xxx",
        },
        {
          device_name: "温湿度2",
          project_name: "智慧农业",
          group_name: "xxx",
        },
        {
          device_name: "温湿度222",
          project_name: "智慧农业",
          group_name: "xxx",
        },
        {
          device_name: "温湿度3",
          project_name: "智慧农业",
          group_name: "xxx",
        },
        {
          device_name: "温湿度4",
          project_name: "智慧农业",
          group_name: "xxx",
        },
        {
          device_name: "温湿度5",
          project_name: "智慧农业",
          group_name: "xxx",
        },
        {
          device_name: "温湿度611",
          project_name: "智慧农业",
          group_name: "xxx",
        },
        {
          device_name: "温湿度611",
          project_name: "智慧农业44",
          group_name: "xxx",
        },
        {
          device_name: "温湿度22",
          project_name: "智慧农业44",
          group_name: "xxx",
        },
      ];
    },
    page_change(val) {
      this.page = val;

      this.displayData = this.filteredData.slice(
        (this.page - 1) * this.page_size,
        this.page * this.page_size
      );
    },
    handleClose() {
      this.page = 1;
      this.project_choice = "";
      this.form = {};
      this.listData = [];
      this.apiDialogVisible = false;
    },
    cancelDialog() {
      this.page = 1;
      this.project_choice = "";
      this.form = {};
      this.listData = [];
      this.apiDialogVisible = false;
    },
    validate() {
      return true;
    },
  },
};
</script>

<style scoped lang="scss">
.code-editor-label {
  color: #fff;
  margin-top: 10px;
}
::v-deep .code_editor .code_area textarea {
  overflow-y: auto;
}
.dialog-box {
  border: 1px solid #e9e9eb;
  padding: 10px;
  cursor: pointer;
  p {
    margin-bottom: 0;
  }
}
.dialog-box:last-child {
  margin-top: 20px;
}

.dialog-border {
  border: 1px solid #5867dd;
  padding: 10px;
  cursor: pointer;
  p {
    margin-bottom: 0;
  }
}

.dialog-border:last-child {
  margin-top: 20px;
}

.list_box {
  margin-top: 20px;
  .item {
    display: flex;
    align-items: center;
    height: 60px;
    justify-content: space-between;
    border-bottom: 1px solid #ccc;
    .flex_full {
      flex: 1;
    }
    &:first-child {
      border-top: 1px solid #ccc;
    }
  }
}
</style>
