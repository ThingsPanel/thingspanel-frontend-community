<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-17 08:49:11
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-28 10:39:14
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\Logger.vue
 * @Description: 场景日志
-->
<template>
  <div>
    <el-dialog title="场景日志" class="el-dark-dialog" :close-on-click-modal="false" :visible.sync="dialogVisible" width="60%"
      height="60%" top="10vh">
      <el-form label-position="left" label-width="85px">

        <!-- 表 start -->
        <el-table :data="tableData" v-loading="loading">

          <el-table-column label="执行时间" prop="trigger_time"></el-table-column>

          <el-table-column label="执行动作" prop="process_description"></el-table-column>

          <el-table-column align="left" :label="$t('AUTOMATION.OPERATION')"  width="80">
            <template v-slot="scope">
              <div style="text-align: center">
                <el-button type="border" size="mini"  @click="handleShowDetail(scope.row)">详情</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <!-- 表 end -->

        <div class="text-right py-3">
          <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
            :page-size="params.per_page" @current-change="getLoggerList"></el-pagination>
        </div>
        <div class="text-right">
          <el-button size="medium" type="cancel" @click="handleClose">关闭</el-button>
        </div>
      </el-form>
    </el-dialog>

    <el-dialog title="日志详情" class="el-dark-dialog" :visible.sync="detailDialogVisible" width="700px"
      top="10vh">
      <el-form label-position="left" label-width="85px">

        <!-- 表 start -->
        <el-table :data="detailTableData" v-loading="loading">
          
          <el-table-column label="目标名称" prop="target_name" width="auto"></el-table-column>

          <!-- 动作类型 -->
          <el-table-column label="动作类型" prop="process_result" width="100">
            <template v-slot="scope">
              <span v-if="scope.row.action_type==='1'">设备输出</span>
              <span v-if="scope.row.action_type==='2'">触发告警</span>
              <span v-if="scope.row.action_type==='3'">激活场景</span>
            </template>
          </el-table-column>

          <el-table-column label="执行状态" prop="process_result">
            <template v-slot="scope">
              <span>{{ scope.row.process_result === "1" ? "成功" : "失败" }}</span>
            </template>
          </el-table-column>

          <el-table-column label="执行内容" prop="process_description"></el-table-column>

          
        </el-table>
        <!-- 表 end -->

        <div class="text-right py-3">
          <el-pagination background layout="prev, pager, next" :total="detailTotal" :current-page.sync="detailParams.current_page"
            :page-size="detailParams.per_page" @current-change="getLoggerDetailList"></el-pagination>
        </div>
        <div class="text-right">
          <el-button size="medium" type="cancel" @click="detailDialogVisible=false">关闭</el-button>
        </div>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import Auto from "@/api/automation_1.0";
export default {
  name: "Logger",
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
    },
    id: {
      type: [String],
      default: ""
    },
  },
  data() {
    return {
      tableData: [],
      params: {
        current_page: 1,
        per_page: 10
      },
      total: 0,
      loading: false,
      detailDialogVisible: false,
      detailTableData: [],
      detailTotal: 0,
      detailParams: {
        current_page: 1,
        per_page: 10
      }
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
      this.params.scenario_strategy_id = this.data.id;
      this.getLoggerList();
    },
    getLoggerList() {
      Auto.Scene.logList(this.params)
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
    handleShowDetail(row) {
      this.detailDialogVisible = true;
      this.detailParams.scenario_log_id = row.id;
      this.getLoggerDetailList();
    },
    getLoggerDetailList() {
      Auto.Scene.logDetail(this.detailParams)
        .then(({ data: result }) => {
          if (result.code === 200) {
            console.log(result.data)
            this.detailTableData = result.data?.data || [];
            this.detailTotal = result.data?.total || 0;
          }
        })
    }
  },
};
</script>