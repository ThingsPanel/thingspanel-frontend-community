<template>
  <div class="information-container">
    <el-tabs class="el-dark-tabs" style="" v-model="tabValue" @tab-click="handleTabClick">
      <el-tab-pane label="数据" name="data">
        <el-form class="el-dark-input" :model="formData">

          <el-form-item label="名称">
            <el-input class="el-dark-input" v-model="formData.name" :disabled="true"></el-input>
          </el-form-item>

          <el-form-item label="标题" v-if="formData.title != undefined">
            <el-input class="el-dark-input" v-model="formData.title" ></el-input>
          </el-form-item>


          <el-form-item label="数据源">

            <el-select v-model="formData.mapping" v-if="formData.type == 'text'" @change="handleChangeMap">
              <el-option v-for="(item, index) in formData.dataSrc" :value="item" :key="index">{{ item }}</el-option>
            </el-select>

            <div v-else v-for="(map, index) in formData.mapping" :key="index">
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
      formData: {},
      tsl: {}
    }
  },
  mounted() {
    // 监听share事件
    bus.$on('share', val => {
      this.formData = val;
      if (val.type == "text") {
        console.log(this.tsl)
        if (this.tsl.properties) {
          this.formData.dataSrc = [];
          this.tsl.properties.forEach(item => {
            console.log("=====", item)
            this.formData.dataSrc.push(item.name)
          })
        }

      }
      console.log("EditorInformation", val)
    });
    bus.$on("shareTsl", val => {
      if (val) {
        this.tsl = val;
      }
      console.log("EditorInformation.tsl", val)
    })
  },
  watch: {
    formData: {
      handler(newValue) {
        let data = {};
        data.title = newValue.title;
        data.value = newValue.title;
        data.mapping = newValue.mapping;
        console.log("====EditorInformation.1", data);
        let properties = null;
        if (this.tsl.properties) {
          properties = this.tsl.properties.find(item => item.name == data.mapping);
        }
        console.log("====EditorInformation.2", data)
        if (properties) {
          data.unit = properties.unit;
        }
        console.log("====EditorInformation.3", data)

        bus.$emit('changeData', newValue.cptId, data);
      },
      deep: true
    }
  },
  methods: {
    handleTabClick() {

    },
    handleChangeMap(val) {
      console.log("handleChangeMap", val)
    }
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