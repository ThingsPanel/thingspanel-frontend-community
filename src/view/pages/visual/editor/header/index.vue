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
      <div class="link-left-list el-dark-input">
<!--        <el-link class="el-dark-link link-item" icon="el-icon-folder">文件</el-link>-->
        <el-dropdown class="el-dark-dropdown" @command="handleFileCommand">
          <span class="el-dropdown-link el-dark-link">
            文件<i class="el-icon-arrow-down el-icon--right"></i>
          </span>
          <el-dropdown-menu slot="dropdown" style="width: 120px;text-align: center">
            <el-dropdown-item command="import">导入</el-dropdown-item>
            <el-dropdown-item command="export">导出</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-link class="el-dark-link link-item" icon="el-icon-edit-outline">编辑</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-refresh-left">撤销</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-s-platform">预览</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-s-platform">更换主题</el-link>

<!--        <el-select size="mini" placeholder="请选择模板" v-model="template" @change="handleChangeTemplate">-->
<!--          <el-option v-for="(template, index) in templateList" :key="index" :label="template.title" :value="template.value"></el-option>-->
<!--        </el-select>-->

      </div>
    </div>

  </div>
</template>

<script>
import bus from "@/core/plugins/eventBus"
import templates from "../../templates/templates.json"
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
      template: "",
      // 模板列表
      templateList: []
    }
  },
  mounted() {
    this.templateList = templates
    console.log("====templates", this.templateList)
  },
  methods: {
    /**
     * 保存
     */
    handleSave() {
      this.$emit("save");
    },
    /**
     * 保存并关闭
     */
    handleSaveAndClose() {
      this.$emit("save");
      window.opener = null;
      window.open('','_self');
      window.close();
    },
    /**
     * 预览
     */
    handlePreview() {

    },
    /**
     * 发布
     */
    handlePublish() {
      bus.$emit("updateVisual")

      console.log("header.publish")
      this.$emit("publish");
    },
    /**
     * 选择文件菜单
     * @param command
     */
    handleFileCommand(command) {
      if (command == "export") {
        this.$emit("showExport");
      } else if (command == "import") {
        this.$emit("showImport");
      }
    },
    /**
     * 选择模板列表
     * @param command
     */
    handleTemplatesCommand(command) {
      console.log(command)
    },
    handleChangeTemplate(val) {
      let temp = this.templateList.find(item => item.value == val)
      this.$emit("import", temp);
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