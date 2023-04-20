<template>
  <span class="clip-container">
    {{ value }}
    <el-tooltip class="item" effect="dark" :content="tipMessage" placement="top-start">
      <i class="el-icon-document-copy" v-clipboard:copy="value"
         v-clipboard:success="onCopy"
         v-clipboard:error="onError"></i>
    </el-tooltip>
  </span>
</template>

<script>
export default {
  name: "ClipButton",
  props: {
    value: {
      type: [String],
      default: ""
    }
  },
  data() {
    return {
      tipMessage: "点击复制"
    }
  },
  methods: {
    /**
     * 剪贴板拷贝成功
     * @param e
     */
    onCopy(e) {
      console.log(e.text)
      this.tipMessage = "复制成功"
    },

    /**
     * 剪贴板拷贝失败
     * @param e
     */
    onError(e) {
      console.log(e)
    }
  }
}
</script>

<style scoped>
.clip-container {
  width: 100%;
  height: 100%;
}
</style>