<template>
  <div class="editor-container">
    <div class="card-container">
      <el-row :gutter="60">
        <el-col :span="12">
          <a>
            <el-card class="box-card" @click.native="customPlugin">
              <div class="text-item">
                <i class="el-icon-edit-outline icon"></i>
                <p>{{ $t('PLUGIN.TAB3_CONTENT.PLACEHOLDER1') }}</p>
                <p class="tips">{{ $t('PLUGIN.TAB3_CONTENT.PLACEHOLDER2') }}</p>
              </div>
            </el-card>
          </a>
        </el-col>
        <el-col :span="12">
          <a>
            <el-card class="box-card"  @click.native="showImportPlugin">
              <div class="text-item">
                <i class="el-icon-folder-add icon"></i>
                <p>{{ $t('PLUGIN.TAB3_CONTENT.IMPOTPLUGINS') }}</p>
                <p class="tips">{{ $t('PLUGIN.TAB3_CONTENT.IMPORTUSE') }}</p>
              </div>
            </el-card>
          </a>
        </el-col>
      </el-row>
    </div>
    <DevicePluginEditor class="tp-dark-editor"
        :visible.sync="showEditorDialog"
        :title="$t('PLUGIN.CUSTOM_DEVICE_PLUGIN')"
        :json="pluginJsonData"
        :plugin-category="pluginCategory"
        @save="save"
        @publish="publish">
    </DevicePluginEditor>

    <LoginStore :visible.sync="loginStoreDialogVisible"></LoginStore>

    <!--    导入JSON-->
    <el-dialog class="el-dark-dialog el-table-transparent" :title=" $t('PLUGIN.TAB3_CONTENT.TITLE')" :visible.sync="importDialogVisible" width="30%">
      <el-row >
        <div style="margin-bottom: 10px;display: flex;justify-content: space-between">
          <span style="padding-top: 10px;">{{ $t('PLUGIN.TAB3_CONTENT.JSONTEST') }}</span>
          <el-upload class="upload-demo" action="#" :limit="1" >
            <el-button type="primary" class="el-button--indigo">{{ $t('PLUGIN.TAB3_CONTENT.SELECTTHEFILE') }}</el-button>
          </el-upload>
<!--          <el-button type="primary" class="el-button&#45;&#45;indigo" >选择文件</el-button>-->
        </div>
      </el-row>
      <el-row>
        <el-input class="el-dark-input" type="textarea" :rows="24" :placeholder="$t('PLUGIN.TAB3_CONTENT.PLACEHOLDER3')" v-model="importPluginJson"></el-input>
      </el-row>

      <span slot="footer" class="dialog-footer">
        <el-button type="cancel" @click="importDialogVisible = false">{{ $t('PLUGIN.TAB3_CONTENT.CANCEL') }}</el-button>
        <el-button type="export" @click="handleImport()">{{ $t('PLUGIN.TAB3_CONTENT.THEIMPORT') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// import DevicePluginEditor from "/packages/device_plugin/editor"

import PluginAPI from "@/api/plugin.js"
import {message_success} from "@/utils/helpers";
import StoreAPI from "@/api/store";
import { message_error } from '@/utils/helpers';
import LoginStore from '@/view/pages/auth/LoginStore';

export default {
  name: "PluginEditor",
  components: { LoginStore },
  data() {
    return {
      activeName: "",
      showEditorDialog: false,
      pluginCategory: [],
      importDialogVisible: false,
      importPluginJson: "",
      pluginJsonData: {},
      id: "",
      loginStoreDialogVisible: false
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
        }
      })
  },
  methods: {
    customPlugin() {
      this.id = "";
      this.pluginJsonData = {};
      this.showEditorDialog = true
      // return false
    },
    showImportPlugin() {
      this.importDialogVisible = true;
    },
    handleImport(data) {
      if (data) {
        this.pluginJsonData = JSON.parse(data.jsonData);
        this.id = data.id;
      } else {
        this.pluginJsonData = JSON.parse(this.importPluginJson);
        this.id = "";
      }
      this.showEditorDialog = true;
    },
    async save(jsonObj, callback) {
      
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
            this.importDialogVisible = false;
            if (callback) callback({ code: 200, msg: "修改成功"});
            this.$emit("save");
          }
        })
      } else {
        // 新增插件
        PluginAPI.add(data).then(({data}) => {
          if (data.code == 200) {
            this.importDialogVisible = false;
            callback && callback({ code: 200, msg: "新增成功！"})
          }
        })
      }
    },
    /**
     * 发布
     * @param data
     * @param callback
     */
    async publish(jsonObj, callback) {
      const isAuth = this.$store.getters.getStoreAuthenticated;
      if (isAuth) {
        // 已登录
        let deviceData = {
          devicePluginType: Number(jsonObj.info.pluginCategory),
          pluginAuthor: jsonObj.info.author,
          pluginName: jsonObj.info.pluginName,
          dataResource: JSON.stringify(jsonObj),
          versionNumber: jsonObj.info.version,
          pluginDescribe: jsonObj.info.description
        }
        if (jsonObj.info.thumbImg && jsonObj.info.thumbImg[0].raw) {
          // 上传图片到本地服务器
          const fd = new FormData()
          fd.append('file', jsonObj.info.thumbImg[0].raw)
          let { data: result } = await StoreAPI.upload(fd)
          deviceData.coverUrl = result.data.file.url
        }
        StoreAPI.publish.device(deviceData)
          .then(({ data: result }) => {
            const msg = "上传成功，请等待审核，审核通过后可以在应用市场查看！";
            callback && callback({ code: 200, msg })
          })

      } else {
        // 未登录
        message_error("请先登录仓库！");
        this.loginStoreDialogVisible = true;
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

.tp-dark-editor {
  ::v-deep tr.el-table__row {
    border-top: 1px solid #ccc!important;
  }
}



</style>