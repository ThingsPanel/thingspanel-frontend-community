<template>
  <div class="editor-container">
    开发中...
  </div>
</template>

<script>
export default {
  name: "PluginEditor",
  data() {
    return {
      activeName: "",
      showEditorDialog: false
    }
  },
  methods: {
    customPlugin() {
      this.showEditorDialog = true
      console.log("configuration")
      // return false
    }
  }
}
</script>

<style scoped lang="scss">
.editor-container {
  display: flex;
  display: -webkit-flex;
  justify-content: center;
  -webkit-justify-content: center;
  align-items: center;
  -webkit-align-items: center;
  margin: 200px auto;
}
.card-container {
  width: 800px;
  height: 400px;

}
.box-card {
  height: 200px
}
.text-item {
  width: 100%;
  height: 200px;
  text-align: center;
  p {
    font-size: 30px;
  }
}
</style>