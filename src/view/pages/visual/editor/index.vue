<template>
  <div class="editor-container">
    <div class="editor-header">
      <!-- header -->
      <EditorHeader :params="params" @save="handleSave" @publish="handlePublish"></EditorHeader>
    </div>

    <div class="editor-content">
      <div class="content-left">
        <!-- 左侧组件栏 -->
        <EditorAside :component-list="componentList"></EditorAside>
      </div>

      <div class="editor-canvas">
        <!-- 画布 -->
        <EditorCanvas ref="editorCanvas" :screen-data="screenData" key="editCanvas"></EditorCanvas>
      </div>

      <div class="information">
        <EditorInformation></EditorInformation>
      </div>
    </div>
  </div>

</template>

<script>
import EditorHeader from "./header"
import EditorAside from "./aside"
import EditorCanvas from "./canvas"
import EditorInformation from "./information"
import PluginAPI from "@/api/plugin.js"
import VisualAPI from "@/api/visualization.js";
import {message_success} from "../../../../utils/helpers";
export default {
  name: "VisualEditor",
  components: {
    EditorHeader, EditorAside, EditorCanvas, EditorInformation
  },
  data() {
    return {
      componentList: [],
      params: {},
      screenId: "",
      relationId: "",
      screenData: []
    }
  },
  mounted() {
    this.params = JSON.parse(JSON.stringify(this.$route.query));
    this.relationId = this.params.businessId;
    if (this.params.deviceId != "") {
      this.relationId = this.params.deviceId;
    } else if (this.params.groupId != "") {
      this.relationId = this.params.groupId;
    }
    // 从插件加载图表
    this.getPluginList();
    // 加载大屏数据
    this.getScreenData();
  },
  methods: {
    handleSave() {
      let data = {
        relation_id: this.relationId,
        json_data: JSON.stringify(this.$refs.editorCanvas.fullData),
        dashboard_name: this.params.name,
      }
      if (this.screenId != "") {
        // 修改
        data.id = this.screenId;
        VisualAPI.edit(data)
          .then(({data}) => {
            if (data.code == 200) {
              message_success("保存成功！")
            }
          })
      } else {
        // 添加
        VisualAPI.add(data)
            .then(({data}) => {
              if (data.code == 200) {
                message_success("保存成功！")
              }
            })
      }
    },
    handlePublish() {
      console.log("publish", this.screenId)
      console.log(this.$refs.editorCanvas.fullData)
    },
    /**
     * 获取插件列表
     */
    getPluginList() {
      PluginAPI.page({"current_page": 1, "per_page": 9999})
        .then(({data}) => {
          if (data.code ==200) {
            let list = data.data.data;
            this.chartList = [];
            list.forEach(item => {
              if (item.chart_data) {
                let jsonObj = JSON.parse(item.chart_data);
                if (jsonObj.chart) {
                  let charts = jsonObj.chart;
                  charts.forEach(item => {
                      this.componentList.push(item)
                  })
                }
              }
            });
          }
        })
    },
    getScreenData() {
      VisualAPI.list({"current_page": 1, "per_page": 10, "relation_id": this.relationId})
        .then(({data}) => {
          if (data.code == 200) {
            let result = data.data.data;
            if (result.length != 0) {
              this.screenId = result[0].id;
              this.screenData = JSON.parse(result[0].json_data);
            }
          }
        })
    }
  }
}
</script>

<style scoped lang="scss">

.editor-container {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: #202c62!important;

}
.editor-header {
  position: absolute;
  right: 0;
  height: 60px;
  width: 100%;
  border: 3px solid #293b79;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)
}
.editor-content {
  position: absolute;
  top: 60px;
  bottom: 0;
  width: 100%;
  height: 100vh;

  .content-left {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 440px;
    left: 0;
  }
  .editor-canvas {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 440px;
    right: 360px;
    background-color: #171d46;
    border: 1px solid #293b79;

  }
  .information {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 360px;
    right: 0;
    padding: 20px;
    background-color: #202c62;
  }
}

</style>