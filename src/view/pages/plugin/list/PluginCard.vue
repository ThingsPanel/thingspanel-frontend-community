<template>
  <b-card class="mb-5 text-center card-border margin-auto marketbox"
          v-bind:key="data.id"
          :title="pluginData.model_name"
          :img-src="'media/logos/wsd.png'"
          img-alt="Image"
          img-top
          tag="article"

  >

    <div style="padding: 2.25rem;">
      <!-- 分类 -->
      <b-card-text class="text-left text-muted">
        {{ $t("COMMON.CLASSIFY") }}：{{ pluginData.type }}
      </b-card-text>

      <!-- 版本 -->
      <b-card-text class="text-left text-muted">
        {{ $t("COMMON.VERSION") }}：{{ pluginData.version }}
      </b-card-text>

      <!-- 作者 -->
      <b-card-text class="text-left text-muted text-overflow">
        {{ $t("COMMON.AUTHOR") }}：
        <span v-b-tooltip :title="pluginData.author">
        {{ pluginData.author }}
      </span>
      </b-card-text>

      <!-- 评分 -->
      <b-card-text class="text-left text-muted">
        {{ $t("COMMON.SCORE") }}：
        <v-rating v-model="rating" color="orange" dense small readonly class="d-inline-block v-application"></v-rating>
      </b-card-text>
    </div>


    <!-- 按钮 -->
    <b-card-text style="margin-top: 10px">
      <b-btn v-show="isInstalled" variant="warning" size="sm" class="text-center" @click="handleEdit">
        {{ $t("COMMON.EDIT") }}
      </b-btn>
      <b-btn v-show="!isInstalled"
             variant="primary" size="sm" class="text-center installing"
             :disabled="installing || isInstalled"
             @click="handleInstall">
        {{ installing ?  $t("COMMON.INSTALLING_TITLE") : $t("COMMON.INSTALL") }}
      </b-btn>
      <b-btn v-show="isInstalled" variant="success" size="sm" class="text-center" style="margin-left: 20px" @click="handleShowExport" >
        {{ $t("COMMON.EXPORT") }}
      </b-btn>
      <b-btn v-show="isInstalled" :disabled="!hasAuth('plugin:device:del')" variant="danger" size="sm" class="text-center" style="margin-left: 20px" @click="handleUninstall" >
        {{ $t("COMMON.UNINSTALL") }}
      </b-btn>
    </b-card-text>

    <!-- 导出JSON-->
    <el-dialog class="el-dark-dialog el-table-transparent" title="导出JSON" :visible.sync="exportDialogVisible" width="30%">
      <el-row >
        <div style="margin-bottom: 10px;display: flex;justify-content: space-between">

        </div>
      </el-row>
      <el-row>
        <el-input class="el-dark-input" type="textarea" :rows="24" :placeholder="$t('COMMON.PLACEHOLDER51')" v-model="exportPluginJson"></el-input>
      </el-row>

      <span slot="footer" class="dialog-footer">
        <el-button  @click="exportDialogVisible = false">{{ $t('COMMON.CANCEL') }}</el-button>
        <el-button type="primary" class="el-button--indigo" @click="handleExport">{{ $t('COMMON.EXPORT') }}</el-button>
        <el-button type="primary" class="el-button--indigo"
                   v-clipboard:copy="exportPluginJson"
                   v-clipboard:success="onCopy"
                   v-clipboard:error="onError"
        >{{ $t('COMMON.PLACEHOLDER52') }}</el-button>
      </span>
    </el-dialog>
  </b-card>
</template>

<script>
import { MessageBox } from 'element-ui';
import {message_success} from "../../../../utils/helpers";
import PluginAPI from "@/api/plugin.js"
export default {
  name: "PluginCard",
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    category: {
      type: [Array],
      default: () => {}
    },
    isInstalled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      pluginData: {},
      // 评分
      rating: 5,
      installing: false,
      exportPluginJson: "",
      exportDialogVisible: false,
    }
  },
  created() {
    this.pluginData = JSON.parse(JSON.stringify(this.data));
    let cat = this.category.find(item => item['dict_value'] == this.pluginData['model_type'])
    this.pluginData['type'] = cat.describe;
  },
  methods: {
    /**
     * 编辑指定插件
     * @param item
     */
    handleEdit() {
      this.$emit("edit", this.pluginData)
    },
    /**
     *
     * 一键安装
     */
    handleInstall() {
      this.installing = true
      setTimeout(() => {
        message_success("安装成功！")
        this.$emit("installed", this.data)
      }, 2000)
    },
    /**
     * 点击插件
     * @param item
     */
    clickPlugin(item) {
      console.log("====clickPlugin", item)
    },
    /**
     * 打开导出对话框
     */
    handleShowExport() {
      this.exportDialogVisible = true;
      this.exportPluginJson = JSON.stringify(JSON.parse(this.pluginData['chart_data']), null, 4);
    },
    /**
     * 卸载插件
     */
    handleUninstall() {
      MessageBox.confirm('卸载该插件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        PluginAPI.del({id: this.pluginData.id })
            .then(({data}) => {
              if (data.code == 200) {
                message_success("卸载成功！")
                this.$emit("delete", this.pluginData);
              }
            })
      }).catch(() => {});


    },
    /**
     * 导出
     */
    handleExport() {

    },
    /**
     * 剪贴板拷贝成功
     * @param e
     */
    onCopy(e) {
      message_success("复制成功！")
    },

    /**
     * 剪贴板拷贝失败
     * @param e
     */
    onError(e) {
      console.log(e)
    }
  }
}
</script>

<style scoped>
.marketbox {
  border-radius: 8px;
}
.text-overflow {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.installing {

}
.card-border{
  border: 1px solid #70A0ED !important;
}
.card-body {
  padding: 10px 0;
}
</style>