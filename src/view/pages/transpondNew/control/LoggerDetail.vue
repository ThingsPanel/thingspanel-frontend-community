<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-17 08:49:11
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-29 17:00:01
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\Logger.vue
 * @Description: 控制策略日志详情
-->
<template>
  <el-dialog :title="$t('AUTOMATION.LOG_DETAIL')" class="el-dark-dialog" :append-to-body="true" :visible.sync="dialogVisible" width="800px"
    top="10vh">
    <el-form label-position="left" label-width="85px">

      <!-- 表 start -->
      <el-table :data="tableData" v-loading="loading">

        <el-table-column :label="$t('AUTOMATION.TARGET_NAME')" prop="target_name" width="auto"></el-table-column>

        <!-- 动作类型 -->
        <el-table-column :label="$t('AUTOMATION.ACTION_TYPE')" prop="process_result" width="100">
          <template v-slot="scope">
            <span v-if="scope.row.action_type==='1'">{{ $t('AUTOMATION.DEVICE_OUT') }}</span>
            <span v-if="scope.row.action_type==='2'">{{ $t('AUTOMATION.TRIGGER_NAME') }}</span>
            <span v-if="scope.row.action_type==='3'">{{ $t('AUTOMATION.ACTIVATE_SCENE') }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('AUTOMATION.EXE_STATUS')" prop="process_result" width="100">
          <template v-slot="scope">
            {{ scope.row.process_result == '1' ? $t('AUTOMATION.SUCEESSFUL') : $t('AUTOMATION.FAILURE') }}
          </template>
        </el-table-column>

        <!-- 说明 -->
        <el-table-column :label="$t('AUTOMATION.EXE_CONTENT')" prop="process_description" width="auto"></el-table-column>

      </el-table>
      <!-- 表 end -->

      <div class="text-right py-3">
        <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
          :page-size="params.per_page" @current-change="getLoggerDetailList"></el-pagination>
      </div>
      <div class="text-right">
        <el-button size="medium" type="cancel" @click="handleClose">{{ $t('AUTOMATION.CLOSE') }}</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script>
import Auto from "@/api/automation_1.0";
export default {
  name: "LoggerDetail",
  props: {
    /**
     * 是否显示编辑/新建对话框
     */
    visible: {
      type: [Boolean],
      default: false,
    },
    data: {
      type: [Object],
      default: () => { return {} }
    }
  },
  data() {
    return {
      tableData: [],
      params: {
        current_page: 1,
        per_page: 10
      },
      total: 0,
      loading: false
    };
  },
  computed: {
    dialogVisible: {
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
        if (newValue) {
          this.initFormData();
        }
      }
    },
  },
  methods: {
    initFormData() {
      console.log("initFormData", this.data)
      this.getLoggerDetailList();
    },
    getLoggerDetailList() {
      console.log(this.params)
      Auto.Control.logDetail({ ...this.params, automation_log_id: this.data.id })
        .then(({ data: result }) => {
          if (result.code === 200) {
            this.tableData = result.data?.data || [];
            this.total = result.data?.total || 0;
          }
        })
    },
    handleClose() {
      this.dialogVisible = false;
    },
    handleShowDetail(item) {

    }
  },
};
</script>