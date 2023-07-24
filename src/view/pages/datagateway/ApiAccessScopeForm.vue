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
            placeholder="全部"
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

      <el-table
        ref="formTable"
        :data="filteredData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
      <!-- <el-table
        ref="formTable"
        :data="listData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      > -->
        <el-table-column
          type="selection"
          :label="$t('RULE_ENGINE.DATA_GATEWAY.INTERFACE_NAME')"
          prop="id"
        ></el-table-column>

        <el-table-column
          :label="$t('RULE_ENGINE.DATA_GATEWAY.INTERFACE_NAME')"
          prop="name"
        ></el-table-column>

        <el-table-column
          :label="$t('RULE_ENGINE.DATA_GATEWAY.URL')"
          prop="url"
        ></el-table-column>

        <el-table-column
          :label="$t('RULE_ENGINE.DATA_GATEWAY.INTERFACE_TYPE')"
          prop="api_type"
        ></el-table-column>

        <el-table-column
          :label="$t('RULE_ENGINE.DATA_GATEWAY.INTERFACE_DESCRIPTION')"
          prop="remark"
        ></el-table-column>
      </el-table>

      <!-- <div class="text-right py-3">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="data_count"
          :current-page.sync="page"
          :page-size="page_size"
          @current-change="page_change"
        ></el-pagination>
      </div> -->

      <div>
        <div style="width: 140px">已选择{{ this.choosedCount }}个接口</div>
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
            @click="handleSubmit"
            >{{ $t("RULE_ENGINE.DATA_GATEWAY.SUBMIT") }}</el-button
          >
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import {
  updateOpenApiInterfaceRelationship,
  getApiInterfaceList,
} from "@/api/dataGateway";
export default {
  name: "ApiAccessScopeForm",
  props: {
    id: { default: null },
    data: { default: [] },
    tableData: { default: null },
    keyword: { default: "" },
    visible: {
      type: [Boolean],
      default: false,
    },
  },
  mounted() {
    this.SelectionChange();
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
    keyword() {
      let data = this.listData;
      if (this.keyword) {
        data = data.filter((item) =>
          item.interface_name.includes(this.keyword)
        );
      }
      this.page = 1;
      // this.filteredData = data.slice(
      //   (this.page - 1) * this.page_size,
      //   this.page * this.page_size
      // );
      this.filteredData = data;
      this.data_count = data.length;
    },
    visible: {
      handler(newValue) {
        if (newValue && this.id) {
          this.loading = true;
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
    // 已选择数量
    choosedCount: 0,
    // 已选择id列表
    choosedIdList: [],
    loading: false,
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
    // page_change(val) {
    //   this.page = val;

    //   let data = this.listData;
    //   if (this.keyword) {
    //     data = data.filter((item) =>
    //       item.interface_name.includes(this.keyword)
    //     );
    //   }
    //   this.filteredData = data.slice(
    //     (this.page - 1) * this.page_size,
    //     this.page * this.page_size
    //   );
    //   this.data_count = data.length;
    // },
    get_interface_data() {
      getApiInterfaceList(this.id).then((res) => {
        if (res.data.code == 200) {
          // this.listData = res.data.data.data;
          // this.data_count = res.data.data.total;
          this.listData = res.data.data;
          this.data_count = res.data.data.length;

          if (this.listData) {
            this.listData.forEach((element) => {
              if (this.choosedIdList.indexOf(element.id) == -1) {
                this.choosedIdList.push(element.id);
              }
            });
            this.choosedCount = this.choosedIdList.length;
          }
          this.filteredData = this.listData;
          // this.filteredData = this.listData.slice(
          //   (this.page - 1) * this.page_size,
          //   this.page * this.page_size
          // );
          // this.filteredData.forEach((row) => {
          console.log(this.$refs.formTable);
          this.listData.forEach((row) => {
          // this.filteredData.map((row) => {
            console.log("choose");

            if (row.is_add === 1) {
              this.$refs.formTable.toggleRowSelection(row, true);
              console.log("choosed");
              console.log(row);
            }
          });

          this.SelectionChange();
          this.loading = false;
        }
      });
    },
    handleSubmit() {
      this.loading = true;
      let params = {
        tp_api_id: this.choosedIdList,
        tp_openapi_auth_id: this.id,
      };

      updateOpenApiInterfaceRelationship(params).then((res) => {
        console.log(params);
        console.log(res);
        if (res.data.code == 200) {
          this.$message({ message: "变更成功", center: true, type: "success" });
        }
        this.get_interface_data();
      });

      this.page = 1;
      this.keyword = "";
      this.form = {};
      this.listData = [];
      this.apiDialogVisible = false;
    },
    handleClose() {
      this.page = 1;
      this.keyword = "";
      this.form = {};
      this.listData = [];
      this.apiDialogVisible = false;
    },
    handleSelectionChange(val) {
      // this.choosedCount = val.length;
      this.choosedIdList = [];

      val.forEach((element) => {
        this.choosedIdList.push(element.id);
      });
      this.choosedCount = this.choosedIdList.length;
    },
    cancelDialog() {
      this.page = 1;
      this.keyword = "";
      this.form = {};
      this.listData = [];
      this.apiDialogVisible = false;
    },
    // 复选框选中
    SelectionChange() {
      this.$nextTick(() => {
        let table = this.filteredData;
        // let table = this.listData;
        // 从后台获取到的数据
        table.forEach((row) => {
          if (row.is_add === 1)
            this.$refs.formTable.toggleRowSelection(row, true);
        });
      });
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
