<template>
  <div class="header-container">
    <div class="left">
      <p style="">
        {{ params.name }}
      </p>
    </div>

    <div class="right">
      <div class="button-div">
        <el-button class="el-button--indigo" size="medium" @click="handleSave">保存</el-button>
        <el-button class="el-button--indigo" size="medium" @click="handleSaveAndClose">保存并关闭</el-button>
        <el-button class="el-button--danger" size="medium" :disabled="false" @click="handlePublish">发布</el-button>
      </div>
    </div>

    <div class="center">
      <div class="link-left-list">
        <el-link class="el-dark-link link-item" icon="el-icon-folder">文件</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-edit-outline">编辑</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-refresh-left">撤销</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-s-platform">预览</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-s-platform">更换主题</el-link>
      </div>
    </div>


  </div>
</template>

<script>
import bus from "@/core/plugins/eventBus"

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
    handleSaveAndClose() {
      this.$emit("save");
      window.opener = null;
      window.open('','_self');
      window.close();
    },
    handlePreview() {

    },
    handlePublish() {
      bus.$emit("updateVisual")

      console.log("header.publish")
      this.$emit("publish");
    }
  }
}
</script>

<style scoped lang="scss">
.header-container {
  //display: inline-flex;
  width: 100%;
  height: 100%;
  .left {
    display: table;
    float: left;
    width: 440px!important;
    p {
      vertical-align: middle;
      display: table-cell;
      width: 440px!important;
      color: #fff;
      font-size: 20px;
      padding-left: 20px;
      height: 60px;
    }
  }
  .center {
    height: 60px;
    line-height: 60px;
    text-align: center;
    .link-left-list {
      text-align: center;
    }
    .link-item {
      margin-right: 20px;
    }
  }
  .right {
    float: right;
    width: 300px;
    .button-div {
      float:right;
      padding: 10px;
    }
  }
}

</style>