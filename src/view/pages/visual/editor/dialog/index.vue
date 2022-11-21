<template>
  <div class="dialog-container">
    <!-- 导入JSON start-->
    <el-dialog class="el-dark-dialog el-table-transparent" title="导入JSON" :visible.sync="optionData.importVisible" width="30%">
      <el-row >
        <div style="margin-bottom: 10px;display: flex;justify-content: space-between">
          <span>在这里粘贴大屏的JSON文本</span>
          <el-upload class="upload-demo" action="#" :limit="1" >
            <el-button type="primary" class="el-button--indigo">选择文件</el-button>
          </el-upload>
          <!--          <el-button type="primary" class="el-button&#45;&#45;indigo" >选择文件</el-button>-->
        </div>
      </el-row>
      <el-row>
        <el-input class="el-dark-input" type="textarea" :rows="24" placeholder="请输入内容" v-model="optionData.importJson"></el-input>
      </el-row>

      <span slot="footer" class="dialog-footer">
        <el-button  @click="optionData.importVisible = false">取 消</el-button>
        <el-button type="primary" class="el-button--indigo" @click="handleImport">导 入</el-button>
      </span>
    </el-dialog>
    <!-- 导入JSON end -->

    <!-- 导出JSON start -->
    <el-dialog class="el-dark-dialog el-table-transparent" title="导出JSON" :visible.sync="optionData.exportVisible" width="30%">
      <el-row >
        <div style="margin-bottom: 10px;display: flex;justify-content: space-between">

        </div>
      </el-row>
      <el-row>
        <el-input class="el-dark-input" type="textarea" readonly :rows="24" v-model="optionData.exportJson"></el-input>
      </el-row>

      <span slot="footer" class="dialog-footer">
        <el-button  @click="optionData.exportVisible = false">取 消</el-button>
        <el-button type="primary" class="el-button--indigo" @click="handleExport">导 出</el-button>
        <el-button type="primary" class="el-button--indigo"
                   v-clipboard:copy="optionData.exportJson"
                   v-clipboard:success="onCopySuccess"
        >复制到剪贴板</el-button>
      </span>
    </el-dialog>
    <!-- 导出JSON end -->
  </div>
</template>

<script>
import {message_success} from "@/utils/helpers";

export default {
  name: "index",
  props: {
    option: {
      type: [Object],
      default: () => { return { } }
    }
  },
  data() {
    return {
      // 导出大屏JSON
      exportScreenJson: "",
      // 导入大屏JSON
      importScreenJson: "",
      // 设置
      optionData: { exportVisible: false, importVisible: false, exportJson: "{}", importJson: "{}"}
    }
  },
  watch: {
    option: {
      handler(newVal) {
        let opt = {};
        opt.exportVisible = newVal.exportVisible ? newVal.exportVisible : false;
        opt.importVisible = newVal.importVisible ? newVal.importVisible : false;
        opt.exportJson = newVal.jsonData ? JSON.stringify(newVal.jsonData, null, 4) : "{}";
        this.optionData = opt;
      }
    }
  },
  methods: {
    /**
     * 导入
     */
    handleImport() {
      this.$emit("import", this.optionData.importJson)
    },
    /**
     * 导出
     */
    handleExport() {

    },
    onCopySuccess() {
      message_success("内容复制成功");
    }
  }
}
</script>

<style scoped>

</style>