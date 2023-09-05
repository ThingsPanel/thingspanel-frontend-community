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
            :no-data-text="$t('COMMON.SELECT_NO_DATA')"
            style="width: 20%; margin-right: 10px"
            class="el-dark-input"
            v-model="formData.isAdd"
            value-key="value"
            placeholder="未添加"
            @change="handleIsAddChange"
          >
            <el-option
              v-for="option in isAddOptions"
              :key="option.value"
              :label="option.name"
              :value="option"
            ></el-option>
          </el-select>

          <!-- 项目列表 -->
          <el-select
            :no-data-text="$t('COMMON.SELECT_NO_DATA')"
            ref="projectRef"
            style="width: 20%; margin-right: 10px"
            :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_PROJECT')"
            v-model="formData.projectId"
            clearable
            value-key="id"
            @change="handleProjectChange"
          >
            <el-option
              v-for="option in projectOptions"
              :key="option.id"
              :label="option.name"
              :value="option.id"
            ></el-option>
          </el-select>

          <!-- 分组列表 -->
          <el-select
            :no-data-text="$t('COMMON.SELECT_NO_DATA')"
            ref="groupRef"
            style="width: 20%; margin-right: 10px"
            clearable
            v-model="formData.groupId"
            :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_GROUP')"
            @change="handleGroupChange"
          >
            <el-option
              v-for="(option, index) in groupOptions"
              :key="index"
              :label="option.device_group"
              :value="option.id"
            ></el-option>
          </el-select>
        </el-col>
      </el-row>

      <el-table :data="listData" v-loading="loading">
        <el-table-column
          :label="$t('RULE_ENGINE.DATA_GATEWAY.DEVICE_NAME')"
          prop="device_name"
          width="160px"
        ></el-table-column>

        <el-table-column
          :label="$t('RULE_ENGINE.DATA_GATEWAY.PROJECT_NAME')"
          prop="business_name"
          width="160px"
        ></el-table-column>

        <el-table-column
          :label="$t('RULE_ENGINE.DATA_GATEWAY.GROUP_NAME')"
          prop="asset_name"
          width="160px"
        ></el-table-column>

        <el-table-column
          prop="actions"
          :label="$t('RULE_ENGINE.DATA_GATEWAY.OPERATION')"
          align="left"
          width="100px"
        >
          <template v-slot="scope">
            <el-button
              size="mini"
              type="indigo"
              v-if="formData.isAdd.value == 0"
              @click="handleAddRelationship(scope.row)"
              >{{ $t("RULE_ENGINE.DATA_GATEWAY.ADD") }}</el-button
            >
            <el-button
              size="mini"
              type="indigo"
              v-if="formData.isAdd.value == 1"
              @click="handleDeleteRelationship(scope.row)"
              >{{ $t("RULE_ENGINE.DATA_GATEWAY.DELETE") }}</el-button
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
import {
  createOpenApiDeviceRelationship,
  deleteOpenApiDeviceRelationship,
  getDeviceList,
} from "@/api/dataGateway";
import { business_index } from "@/api/business";
import { device_group_drop } from "@/api/asset";
import i18n from "@/core/plugins/vue-i18n";

export default {
  name: "DeviceAccessScopeForm",
  props: {
    id: { default: null },
    data: { default: null },
    visible: {
      type: [Boolean],
      default: false,
    },
    initForm: {
      isAdd: { name: i18n.t("RULE_ENGINE.DATA_GATEWAY.MSG_NOT_ADDED"), value: 0 },
      projectId: "",
      groupId: "",
      deviceId: "",
      device: {},
      state: {
        duration: {},
        operator: {
          symbol: "",
          value: "",
        },
      },
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
    visible: {
      handler(newValue) {
        if (newValue && this.id) {
          this.loading = true;

          this.page = 1;
          this.get_device_data();
          this.data_count = this.listData.length;

          this.getProjectChoice();
        }
      },
    },
  },
  data: () => ({
    // 签名方式选项
    signMethodChoice: ["MD5", "HAS256"],
    // 接口访问范围选项
    apiAccessScopeChoice: [
      { name: i18n.t("RULE_ENGINE.DATA_GATEWAY.ALL"), value: 1 },
      { name: i18n.t("RULE_ENGINE.DATA_GATEWAY.PART"), value: 2 },
    ],
    // 设备访问范围选项
    deviceAccessScopeChoice: [
      { name: i18n.t("RULE_ENGINE.DATA_GATEWAY.ALL"), value: 1 },
      { name: i18n.t("RULE_ENGINE.DATA_GATEWAY.PART"), value: 2 },
    ],
    // 是否添加
    isAddOptions: [
      { name: i18n.t("RULE_ENGINE.DATA_GATEWAY.MSG_NOT_ADDED"), value: 0 },
      { name: i18n.t("RULE_ENGINE.DATA_GATEWAY.MSG_ADDED"), value: 1 },
    ],
    // 项目列表
    projectOptions: [],
    // 分组列表
    groupOptions: [],
    // 列表数据
    listData: [],
    // 列表数据
    addedDeviceIdList: [],
    loading: false,
    page: 0,
    page_size: 5,
    data_count: 0,
    formData: {
      isAdd: { name: i18n.t("RULE_ENGINE.DATA_GATEWAY.MSG_NOT_ADDED"), value: 0 },
      projectId: "",
      groupId: "",
      deviceId: "",
      device: {},
      state: {
        duration: {},
        operator: {
          symbol: "",
          value: "",
        },
      },
    },
  }),
  methods: {
    get_device_data() {
      // this.loading = true;
      let data = {
        current_page: this.page,
        per_page: this.page_size,
        tp_openapi_auth_id: this.id,
        is_add: this.formData.isAdd.value,
        business_id: this.formData.projectId,
        asset_id: this.formData.groupId,
      };
      getDeviceList(data).then((res) => {
        if (res.data.code == 200) {
          this.listData = res.data.data.data;
          this.data_count = res.data.data.total;

          this.loading = false;
        }
      });
    },
    page_change(val) {
      this.loading = true;
      this.page = val;
      this.get_device_data();
    },
    handleClose() {
      this.page = 1;
      this.formData = {
        isAdd: { name: i18n.t("RULE_ENGINE.DATA_GATEWAY.MSG_NOT_ADDED"), value: 0 },
        projectId: "",
        groupId: "",
        deviceId: "",
        device: {},
        state: {
          duration: {},
          operator: {
            symbol: "",
            value: "",
          },
        },
      };
      this.listData = [];
      this.apiDialogVisible = false;
    },
    cancelDialog() {
      this.page = 1;
      this.formData = {
        isAdd: { name: i18n.t("RULE_ENGINE.DATA_GATEWAY.MSG_NOT_ADDED"), value: 0 },
        projectId: "",
        groupId: "",
        deviceId: "",
        device: {},
        state: {
          duration: {},
          operator: {
            symbol: "",
            value: "",
          },
        },
      };
      this.listData = [];
      this.apiDialogVisible = false;
    },

    /**
     * 删除绑定关系
     * @param v
     */
    handleDeleteRelationship(v) {
      this.loading = true;
      let params = { tp_openapi_auth_id: this.id, device_id: v.device_id };
      deleteOpenApiDeviceRelationship(params).then(({ data }) => {
        if (data.code == 200) {
          this.$message({ message: i18n.t("COMMON.DELETE_SUCCESS"), center: true, type: "success" });
        }
        this.loading = false;
      });
      this.get_device_data();
    },

    /**
     * 添加绑定关系
     * @param v
     */
    handleAddRelationship(v) {
      this.loading = true;
      let params = { tp_openapi_auth_id: this.id, device_id: v.device_id };
      createOpenApiDeviceRelationship(params).then(({ data }) => {
        if (data.code == 200) {
          this.$message({ message: i18n.t("COMMON.ADD_SUCCESS"), center: true, type: "success" });
        }
        this.loading = false;
        this.get_device_data();
      });
    },

    /**
     * 选择项目
     * @param v
     */
    getProjectChoice() {
      business_index({ limit: 100, page: 1 }).then(({ data }) => {
        if (data.code == 200) {
          this.projectOptions = data.data ? data.data.data : [];
        }
      });
    },

    /**
     * 获取设备分组
     * @param id  项目id
     */
    getGroupList(id) {
      device_group_drop({ business_id: id }).then(({ data }) => {
        if (data.code == 200) {
          this.groupOptions = data?.data || [];
        }
      });
    },
    /**
     * 选择项目
     * @param v
     */
    handleProjectChange(v) {
      this.loading = true;
      this.page = 1;
      this.formData.projectId = v;
      this.formData.groupId = "";
      this.get_device_data();
      if (v) {
        this.getGroupList(v);
      }
    },
    /**
     * 选择分组
     * @param v
     */
    handleGroupChange(v) {
      this.page = 1;
      this.loading = true;
      this.formData.groupId = v;
      this.get_device_data();
    },
    /**
     * 选择是否添加
     * @param v
     */
    handleIsAddChange(v) {
      this.loading = true;
      this.page = 1;
      this.formData.isAdd = v;
      this.get_device_data();
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
