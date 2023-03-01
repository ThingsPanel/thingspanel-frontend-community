<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-17 08:49:11
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-01 15:38:31
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\Logger.vue
 * @Description: 控制策略日志详情
-->
<template>
  <el-dialog title="日志详情" class="el-dark-dialog" :append-to-body="true" :visible.sync="dialogVisible" width="800px"
    top="10vh">
    <el-form label-position="left" label-width="85px">

      <!-- 表 start -->
      <el-table :data="tableData" v-loading="loading">

        <el-table-column label="目标名称" prop="target_name" width="auto"></el-table-column>

        <!-- 动作类型 -->
        <el-table-column label="动作类型" prop="process_result" width="100">
          <template v-slot="scope">
            <span v-if="scope.row.action_type==='1'">设备输出</span>
            <span v-if="scope.row.action_type==='2'">触发告警</span>
            <span v-if="scope.row.action_type==='3'">激活场景</span>
          </template>
        </el-table-column>

        <el-table-column label="执行状态" prop="process_result" width="100">
          <template v-slot="scope">
            {{ scope.row.process_result == '1' ? '成功' : '失败' }}
          </template>
        </el-table-column>

        <!-- 说明 -->
        <el-table-column label="执行内容" prop="process_description" width="auto"></el-table-column>

      </el-table>
      <!-- 表 end -->

      <div class="text-right py-3">
        <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
          :page-size="params.per_page" @current-change="getLoggerDetailList"></el-pagination>
      </div>
      <div class="text-right">
        <el-button size="medium" type="cancel" @click="handleClose">关闭</el-button>
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