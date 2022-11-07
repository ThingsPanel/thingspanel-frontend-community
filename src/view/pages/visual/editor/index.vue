<template>
  <div class="editor-container">
    <div class="editor-header">
      <!-- header -->
      <EditorHeader :params="params" @save="handleSave" @publish="handlePublish"></EditorHeader>
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
        <EditorCanvas ref="editorCanvas" :screen-data="screenData" key="editCanvas"></EditorCanvas>
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
const DEVICE_MODE = 0;
const GROUP_MODE = 1;
const BUSINESS_MODE = 2;

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
      mode: DEVICE_MODE,  // 大屏类型
      relationId: "",
      pluginId: "",
      screenData: []
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
    handleSave() {
      console.log("handleSave", this.$refs.editorCanvas.jsonData)
      let data = {
        relation_id: this.relationId,
        json_data: JSON.stringify(this.$refs.editorCanvas.jsonData),
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
      console.log(this.$refs.editorCanvas.tempData)
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
                      this.componentList.push(item);
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
              // 如果有大屏数据，加载大屏
              this.screenId = result[0].id;
              let jsonData = JSON.parse(result[0].json_data);
              this.screenData  = jsonData.screen ? jsonData.screen : jsonData;
            } else {
              // 如果没有大屏数据，加载设备绑定的插件图表
              if (this.mode == DEVICE_MODE) {
                let param = {"current_page": 1, "per_page": 10, "id": this.pluginId};
                console.log("this.pluginId", this.pluginId)
                PluginAPI.page(param)
                  .then(({data}) => {
                    if (data.code == 200) {
                      let jsonData = data.data.data[0].chart_data;
                      if (jsonData) {
                        let pluginData = JSON.parse(jsonData);
                        let chartData = pluginData.chart;
                        this.screenData = chartData;
                      }
                    }
                  })

              }
            }
          }
        })
    }
  }
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
    width: 440px;
    height: calc(100% - 10px);
  }
  // 中间画布
  .editor-center {
    margin-left: 440px;
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