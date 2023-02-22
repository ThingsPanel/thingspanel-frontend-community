<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-17 08:49:11
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-21 14:08:02
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\Logger.vue
 * @Description: 控制策略日志详情
-->
<template>
  <el-dialog title="日志详情" class="el-dark-dialog" :append-to-body="true" :close-on-click-modal="false" :visible.sync="dialogVisible"
    width="50%" height="60%" top="10vh">
    <el-form label-position="left" label-width="85px">
    
      <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">

        <el-table-column label="触发时间" prop="trigger_time" width="240"></el-table-column>
        <el-table-column label="处理说明" prop="process_description" width="auto"></el-table-column>
  
        <el-table-column label="处理结果" prop="process_result" width="100">
          <template v-slot="scope">
            {{ scope.row.process_result == '1' ? '已处理' : '未处理' }}
          </template>
        </el-table-column>

        <!-- 操作按钮 -->
        <el-table-column align="left" :label="$t('AUTOMATION.OPERATION')"  width="80">
          <template v-slot="scope">
            <div style="text-align: right">
              <el-button type="border" size="mini"  @click="handleShowDetail(scope.row)">详情</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <!-- 表 end -->

      <div class="text-right py-3">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page.sync="params.current_page"
          :page-size="params.per_page"
          @current-change="getLogger(id)"
        ></el-pagination>
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
      default: () => { return {}}
    }
  },
  data() {
    return {
      tableData: [],
      params: {
        current_page: 1,
        per_page: 10,
        id: this.data.id,
        automation_id: this.data.automationId
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
      if (this.id) {
        this.getLogger(this.id);
      }
    },
    getLogger() {
      Auto.Control.logDetail(this.params)
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