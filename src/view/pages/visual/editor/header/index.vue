<template>
  <div class="header-container">
    <div class="left" @click="handleShowEditName">
      <el-input class="input-title" style="width:200px" ref="inputRef"size="small" v-if="edit" v-model="name" @change="inputNameChange" @blur="inputNameChange"></el-input>
      <div class="title" v-else>{{ name }}</div>
    </div>

    <div class="right">
      <div class="button-div">
        <el-button class="el-button--indigo" size="medium" @click="handleSave">保存</el-button>
        <el-button class="el-button--indigo" size="medium" @click="handleSaveAndClose">保存并关闭</el-button>
<!--        <el-button class="el-button&#45;&#45;danger" size="medium" :disabled="false" @click="handlePublish">发布</el-button>-->
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
            <el-dropdown-item command="publish">发布</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-link class="el-dark-link link-item" icon="el-icon-edit-outline">编辑</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-refresh-left">撤销</el-link>

<!--        &lt;!&ndash; 缩小 &ndash;&gt;-->
<!--        <el-link class="el-dark-link link-item" :underline="false" icon="el-icon-minus" @click="handleZoomOut"></el-link>-->
<!--        &lt;!&ndash; 放大 &ndash;&gt;-->
<!--        <el-link class="el-dark-link link-item" :underline="false" icon="el-icon-plus" @click="handleZoomIn"></el-link>-->

<!--        <el-link class="el-dark-link link-item" icon="el-icon-monitor" @click="handleAdapt">自适应</el-link>-->


        <el-link class="el-dark-link link-item" icon="el-icon-s-platform" @click="handlePreview">预览</el-link>
        <el-link class="el-dark-link link-item" icon="el-icon-s-platform">更换主题</el-link>

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
      default: () => { return { name: "123"} }
    }
  },
  data() {
    return {
      template: "",
      // 模板列表
      templateList: [],
      edit: false,
      name: ""
    }
  },
  watch: {
    "params.name": {
      handler(newValue) {
        if (newValue) {
          this.name = newValue;
        }
      },
      immediate: true, deep: true
    }
  },
  mounted() {
    this.templateList = templates
    console.log("====templates", this.templateList)
  },
  methods: {
    handleShowEditName() {
      this.edit = true;
      this.$nextTick(() => {
        this.$refs.inputRef.focus();
      })
    },
    /**
     * 缩小
     */
    handleZoomOut() {
      this.$emit("zoom", -0.1);
    },
    /**
     * 放大
     */
    handleZoomIn() {
      this.$emit("zoom", 0.1);
    },
    /**
     * 自适应
     */
    handleAdapt() {
      this.$emit("adapt");
    },
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
      this.$emit("preview");
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
        this.$emit("show-export");
      } else if (command == "import") {
        console.log("====handleFileCommand", command)
        this.$emit("show-import");
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
    },
    inputNameChange() {
      this.edit = false;
      this.params.name = this.name;
      this.$emit("update:changeName", this.params);
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
    width: 300px!important;
    .title {
      vertical-align: middle;
      display: table-cell;
      width: 200px!important;
      color: #fff;
      font-size: 20px;
      padding-left: 20px;
      height: 60px;
    }
    .input-title {
      vertical-align: middle;
      display: table-cell;
      width: 200px!important;
      color: #fff;
      font-size: 20px;
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