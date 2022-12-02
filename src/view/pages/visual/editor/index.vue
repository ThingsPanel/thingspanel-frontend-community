<template>
  <div class="editor-container">
    <div class="editor-header">
      <!-- 顶部工具栏 -->
      <EditorHeader :params="params"
                    @zoom="handleZoom"
                    @save="handleSave"
                    @publish="handlePublish"
                    @show-import="showImportDialog"
                    @show-export="showExportDialog"
                    @import="handleImport"
      ></EditorHeader>
    </div>

    <div class="editor-content">

      <div class="content-left" style="clear:both">
        <!-- 左侧组件栏 -->
        <EditorAside :component-list="componentList"></EditorAside>
      </div>

      <div class="editor-right" >
        <EditorInformation></EditorInformation>
      </div>

      <div class="editor-center" >
        <!-- 画布 -->
        <EditorCanvas ref="editorCanvas" :json-data="jsonData" key="editCanvas"></EditorCanvas>
      </div>


    </div>

    <dialog-form :option="dialogOption" @import="handleImport"></dialog-form>

  </div>

</template>

<script>
import EditorHeader from "./header"
import EditorAside from "./aside"
import EditorCanvas from "./canvas"
import EditorInformation from "./information"
import DialogForm from "./dialog"
import PluginAPI from "@/api/plugin.js"
import VisualAPI from "@/api/visualization.js";
import {message_success} from "@/utils/helpers";
import bus from "@/core/plugins/eventBus";
import {MessageBox} from "element-ui";
import {message_error} from "@/utils/helpers";

const DEVICE_MODE = 0;
const GROUP_MODE = 1;
const BUSINESS_MODE = 2;

export default {
  name: "VisualEditor",
  components: {
    EditorHeader, EditorAside, EditorCanvas, EditorInformation, DialogForm
  },
  data() {
    return {
      componentList: [],
      params: {},
      screenId: "",
      mode: DEVICE_MODE,  // 大屏类型
      relationId: "",
      pluginId: "",
      screenData: [],
      jsonData: {},
      dialogOption: {}
    }
  },
  mounted() {
    this.params = JSON.parse(JSON.stringify(this.$route.query));
    this.pluginId = this.params.pluginId;
    this.relationId = this.params.businessId;
    this.mode = BUSINESS_MODE;
    if (this.params.deviceId != "") {
      this.relationId = this.params.deviceId;
      this.mode = DEVICE_MODE;
    } else if (this.params.groupId != "") {
      this.relationId = this.params.groupId;
      this.mode = GROUP_MODE;
    }
    // 从插件加载图表
    this.getPluginList();
    // 加载大屏数据
    this.getScreenData();
  },
  methods: {
    handleZoom(v) {
      this.$refs.editorCanvas.setZoom(v);
    },
    showImportDialog() {
      let jsonData = {};
      jsonData.screen = this.$refs.editorCanvas.fullData;
      jsonData.canvasStyle = this.$refs.editorCanvas.canvasStyle;
      this.dialogOption = { jsonData, importVisible: true }
    },
    showExportDialog() {
      let jsonData = {};
      jsonData.screen = this.$refs.editorCanvas.fullData;
      jsonData.canvasStyle = this.$refs.editorCanvas.canvasStyle;
      this.dialogOption = { jsonData, exportVisible: true }
    },
    handleImport(data) {

      console.log("====handleImport.import", typeof data)
      console.log("====handleImport.screen", this.$refs.editorCanvas.fullData)
      let screen = this.$refs.editorCanvas.fullData;
      if (screen && screen.length > 0) {
        MessageBox.confirm('确定要覆盖当前大屏吗?', '提示', {
          confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
        }).then(() => {
          if (typeof data == "object" && data.screen) {
            this.jsonData = data;
          } else {
            checkJsonData(data)
                .then(res => {
                  if (res == true) {
                    this.jsonData = JSON.parse(data);
                    this.$message({type: 'success', message: '导入成功!'});
                  }
                })
                .catch(err => {
                  message_error("请输入正确的JSON代码")
                })
          }
        }).catch(() => {});
      }
    },
    handleSave() {
      let jsonData = {};
      jsonData.screen = this.$refs.editorCanvas.fullData;
      jsonData.canvasStyle = this.$refs.editorCanvas.canvasStyle;

      console.log("handleSave", jsonData)
      let data = {
        relation_id: this.relationId,
        json_data: JSON.stringify(jsonData),
        dashboard_name: this.params.name,
      }
      if (this.screenId != "") {
        // 修改
        data.id = this.screenId;
        VisualAPI.edit(data)
          .then(({data}) => {
            if (data.code == 200) {
              message_success("保存成功！")
              bus.$emit("updateVisual")
            }
          })
      } else {
        // 添加
        VisualAPI.add(data)
            .then(({data}) => {
              if (data.code == 200) {
                this.screenId = data.data.id;
                message_success("保存成功！")
                bus.$emit("updateVisual")
              }
            })
      }
    },
    handlePublish() {
      console.log("publish", this.screenId)
      console.log(this.$refs.editorCanvas.tempData)
    },
    /**
     * 获取大屏数据
     */
    getScreenData() {
      VisualAPI.list({"current_page": 1, "per_page": 10, "relation_id": this.relationId})
        .then(({data}) => {
          if (data.code == 200) {
            console.log("====jsonData.screen", data)

            let result = data.data.data;
            if (result.length != 0) {

              // 如果有大屏数据，加载大屏
              this.screenId = result[0].id;
              let jsonData = JSON.parse(result[0].json_data);
              this.jsonData  = jsonData;
            } else {
              // 如果没有大屏数

            }
          }
        })
    },

  }
}

const checkJsonData = (jsonData) => {
  return new Promise(function (resolve, reject) {
    if (!jsonData) reject(false);
    JSON.parse(jsonData);
    resolve(true);
  });
}
</script>

<style scoped lang="scss">

.editor-container {
  width: 100%;
  height: 100%;
  background-color: #202c62!important;
}
.editor-header {
  height: 60px;
  width: 100%;
  border: 3px solid #293b79;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)
}
.editor-content {
  width: 100%;
  height: calc(100% - 60px);
  // 左侧组件列表
  .content-left {
    float:left;
    width: 300px;
    height: calc(100% - 10px);
  }
  // 中间画布
  .editor-center {
    margin-left: 300px;
    margin-right: 250px;
    height: calc(100% - 10px);
    background-color: #171d46;
    border: 1px solid #293b79;
  }
  // 右侧information
  .editor-right {
    float: right;
    width: 250px;
    height: calc(100% - 10px);
    background-color: #202c62;
  }
}
.editor-content::after {
  content: '';
  display: block;
  visibility: hidden;
  clear: both;
}

</style>