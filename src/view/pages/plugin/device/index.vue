<template>
  <div class="editor-container">
    <div class="card-container">
      <el-row :gutter="60">
        <el-col :span="12">
          <a>
            <el-card class="box-card" @click.native="customPlugin">
              <div class="text-item">
                <i class="el-icon-edit-outline icon"></i>
                <p>{{ $t('COMMON.PLACEHOLDER53') }}</p>
                <p class="tips">{{ $t('COMMON.PLACEHOLDER54') }}</p>
              </div>
            </el-card>
          </a>
        </el-col>
        <el-col :span="12">
          <a>
            <el-card class="box-card"  @click.native="showImportPlugin">
              <div class="text-item">
                <i class="el-icon-folder-add icon"></i>
                <p>{{ $t('COMMON.IMPOTPLUGINS') }}</p>
                <p class="tips">{{ $t('COMMON.IMPORTUSE') }}</p>
              </div>
            </el-card>
          </a>
        </el-col>
      </el-row>
    </div>
<!--    <tp-editor class="tp-dark-editor" :visible.sync="showEditorDialog" :json="pluginJsonData" :plugin-category="pluginCategory" @publish="publish"></tp-editor>-->
    <DevicePluginEditor class="tp-dark-editor" :visible.sync="showEditorDialog" :json="pluginJsonData" :plugin-category="pluginCategory" @publish="publish"></DevicePluginEditor>

    <!--    导入JSON-->
    <el-dialog class="el-dark-dialog el-table-transparent" title="导入JSON" :visible.sync="importDialogVisible" width="30%">
      <el-row >
        <div style="margin-bottom: 10px;display: flex;justify-content: space-between">
          <span>{{ $t('COMMON.JSONTEST') }}</span>
          <el-upload class="upload-demo" action="#" :limit="1" >
            <el-button type="primary" class="el-button--indigo">{{ $t('COMMON.SELECTTHEFILE') }}</el-button>
          </el-upload>
<!--          <el-button type="primary" class="el-button&#45;&#45;indigo" >选择文件</el-button>-->
        </div>
      </el-row>
      <el-row>
        <el-input class="el-dark-input" type="textarea" :rows="24" :placeholder="$t('COMMON.PLACEHOLDER51')" v-model="importPluginJson"></el-input>
      </el-row>

      <span slot="footer" class="dialog-footer">
        <el-button  @click="importDialogVisible = false">{{ $t('COMMON.CANCEL') }}</el-button>
        <el-button type="primary" class="el-button--indigo" @click="handleImport()">{{ $t('COMMON.THEIMPORT') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// import DevicePluginEditor from "/packages/device_plugin/editor"

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
      pluginJsonData: {},
      id: ""
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
    handleImport(data) {
      if (data) {
        this.pluginJsonData = JSON.parse(data.chart_data);
        this.id = data.id;
      } else {
        this.pluginJsonData = JSON.parse(this.importPluginJson);
        this.id = "";
      }
      console.log("handleImport", this.pluginJsonData);
      this.showEditorDialog = true;
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
      if (this.id) {
        data.id = this.id;
        // 修改插件
        PluginAPI.edit(data).then(({data}) => {
          if (data.code == 200) {
            message_success("插件修改成功");
            this.importDialogVisible = false;
            if (callback) callback(true)
          }
        })
      } else {
        // 新增插件
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