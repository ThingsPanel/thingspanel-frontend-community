<template>
  <div class="editor-container">
    <div class="card-container">
      <el-row :gutter="60">
        <el-col :span="12">
          <a>
            <el-card class="box-card" @click.native="customPlugin">
              <div class="text-item">
                <i class="el-icon-edit-outline icon"></i>
                <p>自定义插件</p>
                <p class="tips">解决个性化设备需求</p>
              </div>
            </el-card>
          </a>
        </el-col>
        <el-col :span="12">
          <a>
            <el-card class="box-card"  @click.native="showImportPlugin">
              <div class="text-item">
                <i class="el-icon-folder-add icon"></i>
                <p>导入插件</p>
                <p class="tips">导入即用</p>
              </div>
            </el-card>
          </a>
        </el-col>
      </el-row>
    </div>
    <tp-editor class="tp-dark-editor" :visible.sync="showEditorDialog" :json="pluginJsonData" :plugin-category="pluginCategory" @publish="publish"></tp-editor>

    <!--    导入JSON-->
    <el-dialog class="el-dark-dialog el-table-transparent" title="导入JSON" :visible.sync="importDialogVisible" width="30%">
      <el-row >
        <div style="margin-bottom: 10px;display: flex;justify-content: space-between">
          <span>在这里粘贴插件的JSON文本</span>
          <el-upload class="upload-demo" action="#" :limit="1" >
            <el-button type="primary" class="el-button--indigo">选择文件</el-button>
          </el-upload>
<!--          <el-button type="primary" class="el-button&#45;&#45;indigo" >选择文件</el-button>-->
        </div>
      </el-row>
      <el-row>
        <el-input class="el-dark-input" type="textarea" :rows="24" placeholder="请输入内容" v-model="importPluginJson"></el-input>
      </el-row>

      <span slot="footer" class="dialog-footer">
        <el-button  @click="importDialogVisible = false">取 消</el-button>
        <el-button type="primary" class="el-button--indigo" @click="handleImport">导 入</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import PluginAPI from "@/api/plugin.js"
import {message_success} from "@/utils/helpers";
export default {
  name: "PluginEditor",
  data() {
    return {
      activeName: "",
      showEditorDialog: false,
      pluginCategory: [],
      importDialogVisible: false,
      importPluginJson: "",
      pluginJsonData: {}
    }
  },
  created() {
    /**
     * 传入dict_code为chart_type,只返回chart_type的插件分类
     */
    PluginAPI.category({"current_page": 1, "per_page": 9999, "dict_code": "chart_type"})
      .then(({data}) => {
        if (data.code == 200) {
          let arr = data.data.data;
          this.pluginCategory = arr.map(item => {
            return { label: item.describe, value: item['dict_value'] }
          }).reverse();
          console.log(this.pluginCategory)
        }
      })
  },
  methods: {
    customPlugin() {
      this.showEditorDialog = true
      console.log("configuration")
      // return false
    },
    showImportPlugin() {
      this.importDialogVisible = true;
    },
    handleImport() {
      this.pluginJsonData = JSON.parse(this.importPluginJson);
      this.showEditorDialog = true;
      // this.publish(JSON.parse(this.importPluginJson));
    },
    /**
     * 发布
     * @param data
     * @param callback true：发布成功, false: 发布失败
     */
    publish(jsonObj, callback) {
      let data = {
        model_type: jsonObj.info.pluginCategory,
        chart_data: JSON.stringify(jsonObj),
        model_name: jsonObj.info.pluginName,
        author: jsonObj.info.author,
        version: jsonObj.info.version
      };
      PluginAPI.add(data).then(({data}) => {
        if (data.code == 200) {
          message_success("插件导入成功");
          this.importDialogVisible = false;
          if (callback) callback(true)
        }
      })
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
  height: 300px;
  background: #3f4aa6;
  border: 0;
  color: #fff;
  .text-item {
    width: 100%;
    height: 260px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    p {
      font-size: 30px;
    }
    .icon {
      font-size: 50px;
      margin-bottom: 18px;
    }
    .tips {
      color: #ccc;
      font-size: 18px;
    }
  }

}
::v-deep .tp-editor .el-transfer-panel__item.el-checkbox {
  color: #000000!important;
}
::v-deep .el-dialog__header {
  background-color: #2d3d88!important;
}
  ::v-deep  .el-dialog {
    background-color: #2d3d88!important;

    .el-dialog__close,.el-dialog__title,.el-table thead,.label-name{
      color: #a8c5ff;
    }

    .el-dialog__body{
      color: #fff;
    }
  }
</style>