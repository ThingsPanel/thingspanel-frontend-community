<template>
  <div class="editor-container">
    <div class="left">
      <p style="">
        {{ params.name }}
      </p>

    </div>

    <div class="center">
      <div class="link-left-list">
        <el-link class="el-dark-link link-item" icon="el-icon-folder">文件</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-edit-outline">编辑</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-refresh-left">撤销</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-s-platform">预览</el-link>
      </div>
    </div>

    <div class="right">
      <div class="button">
        <el-button class="el-button--indigo" size="medium" @click="handleSave">保存</el-button>
<!--        <el-button class="el-button&#45;&#45;indigo" size="medium" @click="handlePreview">预览</el-button>-->
        <el-button class="el-button--danger" size="medium" :disabled="false" @click="handlePublish">发布</el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EditorHeader",
  props: {
    params: {
      type: [Object],
      default: () => { return {} }
    }
  },
  data() {
    return {
    }
  },
  methods: {
    handleSave() {
      this.$emit("save");
    },
    handlePreview() {

    },
    handlePublish() {
      console.log("header.publish")
      this.$emit("publish");
    }
  }
}
</script>

<style scoped lang="scss">
.editor-container {
  display: inline-flex;
  width: 100%;
  height: 100%;
  .left {
    display: table;
    width: 440px!important;
    p {
      vertical-align: middle;
      display: table-cell;
      width: 440px!important;
      color: #fff;
      font-size: 20px;
      padding-left: 20px;

    }
  }
  .center {
    position: absolute;
    left: 440px;
    right: 360px;
    height: 60px;
    line-height: 60px;
    text-align: center;
    //display: table;
    .link-left-list {
      //display: table-cell;
      //vertical-align: middle;
      text-align: center;

    }
    .link-item {
      margin-right: 20px;
    }
  }
  .right {
    position: absolute;
    display: table;
    width: 360px;
    right: 0;
    .button {
      padding: 10px;
      display: table-cell;
      vertical-align: middle;

    }
  }
}

</style>