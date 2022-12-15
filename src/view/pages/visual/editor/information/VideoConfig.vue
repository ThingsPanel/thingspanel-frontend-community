<!-- 文本配置面板 -->
<template>
  <div>
    <el-row style="margin: 20px 0 20px 0">
      <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">名称</el-col>
      <el-col :span="18"><el-input size="mini" v-model="form.name"></el-input></el-col>
    </el-row>

    <el-collapse class="el-dark-collapse information-collapse" style="padding:10px;" v-model="activeNames">

      <el-collapse-item title="信息" name="info">
        <el-row>
          <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">文本</el-col>
          <el-col :span="18"><el-input size="mini" v-model="form.value"></el-input></el-col>
        </el-row>
      </el-collapse-item>

      <el-collapse-item title="视频源" name="videoSource">
        <el-row>
          <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">url</el-col>
          <el-col :span="18"><el-input size="mini" v-model="form.src"></el-input></el-col>
        </el-row>
      </el-collapse-item>



    </el-collapse>
  </div>
</template>

<script>
import bus from "@/core/plugins/eventBus"
export default {
  name: "VideoConfig",
  components: {},
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