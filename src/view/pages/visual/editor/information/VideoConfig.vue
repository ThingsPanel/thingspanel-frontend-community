<!-- 文本配置面板 -->
<template>
  <div>
    <el-tabs class="el-dark-tabs" style="" v-model="tabValue">
      <el-tab-pane label="配置" name="data">
        <BaseConfig :name="form.name" :z="form.point.z" :w="form.point.w" :h="form.point.h"></BaseConfig>

        <el-collapse class="el-dark-collapse information-collapse" style="padding:10px;" v-model="activeNames">

<!--          <el-collapse-item title="信息" name="info">-->
<!--          </el-collapse-item>-->

          <el-collapse-item title="视频源" name="videoSource">
            <el-row>
              <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">url</el-col>
              <el-col :span="18"><el-input size="mini" v-model="form.src"></el-input></el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
      <el-tab-pane label="样式" name="style">
        <style-panel></style-panel>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import bus from "@/core/plugins/eventBus"
import StylePanel from "./StylePanel"
export default {
  name: "VideoConfig",
  components: { StylePanel },
  props: {
    formData: {
      type: [Object],
      default: () => { return {} }
    },
    casOptions: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      activeNames: ["info", "videoSource"],
      tabValue: "data",
      form: {
        name: "",
        text: "",
        mapping: "",
        casValue: "",
        deviceId: "",
        src: ""
      },
      dataSrcOptions: []
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
        bus.$emit('changeData', newValue);
      },
      deep: true
    }
  },
  methods: {

  }
}
</script>

<style scoped>
.el-collapse-item {
  border-top: 1px solid #FFFFFF17;
}
.information-collapse {
  padding: 0!important;
}
::v-deep .el-collapse-item__content {
  padding: 10px 0 20px 14px;
}
.el-select {
  padding: 10px 0 0 0;
}
</style>