<template>
  <div>
    <el-tabs class="el-dark-tabs" style="" v-model="tabValue">
      <el-tab-pane label="页面配置" name="data">
        <el-row>
          <el-col :span="8" style="height:100%;padding-top: 6px;color:#fff">宽：</el-col>
          <el-col :span="16"><el-input-number size="mini" v-model="form.intWidth"></el-input-number></el-col>
        </el-row>
        <el-row>
          <el-col :span="8" style="height:100%;padding-top: 6px;color:#fff">高：</el-col>
          <el-col :span="16"><el-input-number size="mini" v-model="form.intHeight"></el-input-number></el-col>
        </el-row>
        <el-row>
          <el-col :span="8" style="height:100%;padding-top: 6px;color:#fff">背景颜色：</el-col>
          <el-col :span="16"><el-color-picker size="small" v-model="form.backgroundColor"></el-color-picker></el-col>
        </el-row>

        <el-row>
          <el-col :span="24" style="height:100%;padding-top: 6px;color:#fff">
            <el-button type="blue" style="width: 100%" @click="handleReset">恢复默认值</el-button>
          </el-col>
        </el-row>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script>
import bus from "@/core/plugins/eventBus"

export default {
  name: "BackgroundConfig",
  props: {
    formData: {
      type: [Object],
      default: () => { return {} }
    },
  },
  data() {
    return {
      tabValue: "data",
      form: {
        type: "background",
        intWidth: 1920,
        intHeight: 1080,
        backgroundColor: "#2d3d86"
      }
    }
  },
  watch: {
    formData: {
      handler(newValue){
        this.form = JSON.parse(JSON.stringify(newValue));
      }
    },
    form: {
      handler(newValue) {
        console.log("====share.background.form", newValue)
        bus.$emit('changeStyle', null, newValue);
      },
      deep: true
    }
  },
  methods: {
    handleReset() {
      this.form = {
        type: "background",
        intWidth: 1920,
        intHeight: 1080,
        backgroundColor: "#2d3d86"
      }
    }
  }
}
</script>

<style scoped>
.el-row {
  margin: 20px 0 20px 0;
}
</style>