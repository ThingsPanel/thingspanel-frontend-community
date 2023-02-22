<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-17 08:49:11
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-21 10:35:29
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\Logger.vue
 * @Description: 场景日志
-->
<template>
  <el-dialog title="场景日志" class="el-dark-dialog" :close-on-click-modal="false" :visible.sync="dialogVisible"
    width="60%" height="60%" top="10vh">
    <el-form label-position="left" label-width="85px">
    
      <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">

        <el-table-column label="执行时间" prop="trigger_time"></el-table-column>
  
        <el-table-column label="执行动作" prop="process_description"></el-table-column>
      </el-table>
      <!-- 表 end -->

      <div class="text-right py-3">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page.sync="params.current_page"
          :page-size="params.per_page"
          @current-change="getLoggerList(id)"
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
  name: "Logger",
  props: {
    /**
     * 是否显示编辑/新建对话框
     */
    visible: {
      type: [Boolean],
      default: false,
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
        this.getLoggerList(this.id);
      }
    },
    getLoggerList(id = "") {
      this.params.id = id;  
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
    }
  },
};
</script>