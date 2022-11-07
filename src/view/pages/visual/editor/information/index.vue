<template>
  <div class="information-container">
    <el-tabs class="el-dark-tabs" style="" v-model="tabValue" @tab-click="handleTabClick">
      <el-tab-pane label="数据" name="data">
        <el-form class="el-dark-input" :model="formData">

          <el-form-item label="名称">
            <el-input class="el-dark-input" v-model="formData.name" :disabled="true"></el-input>
          </el-form-item>
          <el-form-item label="数据源">
            <div v-for="(map, index) in formData.mapping" :key="index">
              <el-input class="el-dark-input" v-model="formData.mapping[index]" :disabled="true"></el-input>
            </div>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="样式" name="style">
        <style-panel></style-panel>
      </el-tab-pane>
    </el-tabs>
  </div>

</template>

<script>
import bus from "@/core/plugins/eventBus"
import StylePanel from "./style"

export default {
  name: "EditorInformation",
  components: { StylePanel },
  data() {
    return {
      tabValue: "data",
      formData: {}
    }
  },
  mounted() {
    // 监听share事件
    bus.$on('share', val => {
      this.formData = val;
    })
  },
  watch: {
    formData: {
      handler(newValue) {
        // console.log("information.watch.formData", newValue)
      },
      deep: true
    }
  },
  methods: {
    handleTabClick() {

    },
  }
}
</script>

<style scoped>
.information-container {
  width: 100%;
  height: 100%;
  padding: 20px
}
</style>