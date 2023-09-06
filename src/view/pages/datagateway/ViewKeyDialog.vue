<template>
  <el-dialog
    :title="
      id
        ? $t('RULE_ENGINE.DATA_GATEWAY.EDIT')
        : $t('RULE_ENGINE.DATA_GATEWAY.CREATE')
    "
    class="el-dark-dialog"
    :close-on-click-modal="false"
    :before-close="handleClose"
    :visible.sync="viewKeyDialogVisible"
    width="40%"
    height="60%"
    top="10vh"
  >
    <div class="rounded p-4 card">
      <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
        <el-col :span="24">
          <el-select
            :no-data-text="$t('COMMON.SELECT_NO_DATA')"
            style="width: 20%"
            class="el-dark-input"
            :placeholder="$t('COMMON.ALL')"
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

          <el-input
            v-model="keyword"
            style="width: 20%; margin-left: 10px"
            :placeholder="$t('RULE_ENGINE.DATA_GATEWAY.INTERFACE_NAME')"
            clearable
          >
          </el-input>
        </el-col>
      </el-row>

      <div>
        <div style="width: 140px">已选择{{ this.choosed_count }}个接口</div>
        <div style="text-align: right">
          <el-button
            class="cancel-button"
            type="cancel"
            size="medium"
            plain
            @click="handleClose"
            >{{ $t("RULE_ENGINE.DATA_GATEWAY.CANCEL") }}</el-button
          >
          <el-button
            style="margin-left: 10px"
            class="medium"
            type="save"
            size="medium"
            @click="onSubmit"
            >{{ $t("RULE_ENGINE.DATA_GATEWAY.SUBMIT") }}</el-button
          >
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "ViewKeyDialog",
  props: {
    id: { default: null },
    data: { default: [] },
    tableData: { default: null },
    keyword: { default: "" },
    choosed_count: { default: 0 },
    visible: {
      type: [Boolean],
      default: false,
    },
  },
  computed: {
    viewKeyDialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
  watch: {
    keyword() {
      let data = this.listData;
      if (this.keyword) {
        data = data.filter((item) =>
          item.interface_name.includes(this.keyword)
        );
      }
      this.page = 1;
      this.filteredData = data.slice(
        (this.page - 1) * this.page_size,
        this.page * this.page_size
      );
      this.data_count = data.length;
    },
    visible: {
      handler(newValue) {
        if (newValue && this.id) {
          // 编辑
          this.page = 1;
          this.get_interface_data();
          this.data_count = this.filteredData.length;
        }
      },
    },
  },
  data: () => ({
    page: 0,
    page_size: 5,
    data_count: 0,
    loading: true,
    // 列表数据
    listData: [],
    filteredData: [],
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
    handleClose() {
      this.page = 1;
      this.keyword = "";
      this.form = {};
      this.listData = [];
      this.viewKeyDialogVisible = false;
    },
    cancelDialog() {
      this.page = 1;
      this.keyword = "";
      this.form = {};
      this.listData = [];
      this.viewKeyDialogVisible = false;
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
