
<template>
  <div class="publish-container">
    <el-form style="padding: 40px 30px;">
      <el-form-item>
        <el-input type="textarea"  v-model="jsonStr" :autosize="{ minRows: 26, maxRows: 26}"></el-input>
      </el-form-item>
      <!-- <el-form-item>
        <el-checkbox v-model="isPublic">{{ $t('PLUGIN.RELEASE_INFO_TAB.TEXT') }}</el-checkbox>
      </el-form-item> -->
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