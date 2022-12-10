<template>
  <div class="publish-container">
    <el-form style="padding: 40px 30px;bottom: 50px">
      <el-form-item>
        <el-input type="textarea"  v-model="jsonStr" :autosize="{ minRows: 22, maxRows: 22}"></el-input>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="isPublic">是否同意发布到应用商店</el-checkbox>
      </el-form-item>
    </el-form>

  </div>
</template>

<script>
export default {
  name: "CommonPublish",
  props: {
    data: {
      type: [Object],
      default: () => { return {} }
    }
  },
  data() {
    return {
      jsonStr: "{}",
      isPublic: false
    }
  },
  watch: {
    data: {
      handler(newValue) {
        this.jsonStr = JSON.stringify(newValue, null, 4);
      },
      immediate: true
    },
  }
}
</script>

<style scoped>
.publish-container {
  height: 620px;
}
</style>