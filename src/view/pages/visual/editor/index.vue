<template>
  <div class="editor-container">
    <div class="editor-header">
      <!-- 顶部工具栏 -->
      <EditorHeader :params.sync="params"
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
import VisualAPI from "@/api/visualization.js";
import {message_success} from "@/utils/helpers";
import bus from "@/core/plugins/eventBus";
import {MessageBox} from "element-ui";
import {message_error} from "@/utils/helpers";


export default {
  name: "VisualEditor",
  components: {
    EditorHeader, EditorAside, EditorCanvas, EditorInformation, DialogForm
  },
  data() {
    return {
      componentList: [],
      visualId: "",
      screenData: [],
      jsonData: {},
      dialogOption: {},
      params: {}
    }
  },
  mounted() {
    // 获取可视化大屏id
    this.visualId = this.$route.query.id;
    // 加载可视化大屏数据
    this.getScreenData(this.visualId);
    // 获取项目/分组/设备的级联菜单数据
    this.getCasOptions();
  },
  methods: {
    /**
     * 缩放
     * @param v
     */
    handleZoom(v) {
      this.$refs.editorCanvas.setZoom(v);
    },
    /**
     * 自适应
     */
    handleAdapt() {
      this.$refs.editorCanvas.adapt();
    },
    /**
     * 打开导入对话框
     */
    showImportDialog() {
      let jsonData = {};
      jsonData.screen = this.$refs.editorCanvas.fullData;
      jsonData.canvasStyle = this.$refs.editorCanvas.canvasStyle;
      this.dialogOption = { jsonData, importVisible: true }
    },
    /**
     * 打开导出对话框
     */
    showExportDialog() {
      let jsonData = {};
      jsonData.screen = this.$refs.editorCanvas.fullData;
      jsonData.canvasStyle = this.$refs.editorCanvas.canvasStyle;
      this.dialogOption = { jsonData, exportVisible: true }
    },
    /**
     * 导入可视化大屏数据
     * @param data
     */
    handleImport(data) {
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
    /**
     * 保存可视化大屏数据
     */
    handleSave() {
      if (this.visualId == "") return;
      let jsonData = {};
      jsonData.screen = this.$refs.editorCanvas.fullData;
      jsonData.canvasStyle = this.$refs.editorCanvas.canvasStyle;
      let data = {
        id: this.visualId,
        json_data: JSON.stringify(jsonData),
        dashboard_name: this.params.name,
      }
      // 修改
      VisualAPI.edit(data)
        .then(({data}) => {
          if (data.code == 200) {
            message_success("保存成功！")
            bus.$emit("updateVisual")
          }
        })
    },
    handlePublish() {
      console.log(this.$refs.editorCanvas.tempData)
    },
    /**
     * 获取大屏数据
     */
    getScreenData(id) {
      VisualAPI.list({ current_page: 1, per_page: 10, id })
        .then(({data}) => {
          if (data.code == 200) {
            let result = data.data.data;
            if (result.length != 0) {
              this.params = { name: result[0].dashboard_name };
              console.log("====this.params", this.params)
              let jsonData = JSON.parse(result[0].json_data);
              this.jsonData  = jsonData;
            }
          }
        })
    },
    /**
     * 获取项目/分组/设备的级联菜单
     */
    getCasOptions() {
      VisualAPI.getTree(null)
          .then(({ data }) => {
            if (data.code == 200) {
              // 将获取到的数据转换为可用数据
              let casOptions = washData(data.data);
              bus.$emit("getCasOptions", casOptions)
            }
          })
    }
  }
}

const checkJsonData = (jsonData) => {
  return new Promise(function (resolve, reject) {
    if (!jsonData) reject(false);
    JSON.parse(jsonData);
    resolve(true);
  });
}
/**
 * 清洗数据获取可用的级联菜单数据
 * @param options
 * @returns {*}
 */
const washData = (options) => {
  let opt = options;
  options.forEach(business => {
    business.value = business.business_id;
    business.label = business.business_name;
    if (business.children) {
      business.children.forEach(group => {
        group.value = group.group_id;
        group.label = group.group_name;
        if (group.children) {
          group.children.forEach(device => {
            device.value = device.device_id;
            device.label = device.device_name;
          })
        }
      })
    }
  });
  return opt;
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