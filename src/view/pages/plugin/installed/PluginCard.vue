<template>
  <b-card class="mb-5 text-center card-border margin-auto marketbox"
          v-bind:key="data.id"
          :title="pluginData.name"
          :img-src="'media/logos/wsd.png'"
          img-alt="Image"
          img-top
          tag="article"

  >

    <div style="padding: 2.25rem;">
      <!-- 分类 -->
      <b-card-text class="text-left text-muted">
        {{ $t("PLUGIN.TAB1_CONTENT.CLASSIFY") }}：{{ pluginData.devicePluginTypeLabel }}
      </b-card-text>

      <!-- 版本 -->
      <b-card-text class="text-left text-muted">
        {{ $t("PLUGIN.TAB1_CONTENT.VERSION") }}：{{ pluginData.version }}
      </b-card-text>

      <!-- 作者 -->
      <b-card-text class="text-left text-muted text-overflow">
        {{ $t("PLUGIN.TAB1_CONTENT.AUTHOR") }}：
        <span v-b-tooltip :title="pluginData.author">
        {{ pluginData.author }}
      </span>
      </b-card-text>

      <!-- 评分 -->
      <b-card-text class="text-left text-muted">
        {{ $t("PLUGIN.TAB1_CONTENT.SCORE") }}：
        <v-rating v-model="rating" color="orange" dense small readonly class="d-inline-block v-application"></v-rating>
      </b-card-text>
    </div>


    <!-- 按钮 -->
    <b-card-text style="margin-top: 10px">
      <b-btn v-show="pluginData.pluginType === pluginType.Device" variant="warning" size="sm" class="text-center" @click="handleEdit">
        {{ $t("PLUGIN.TAB1_CONTENT.EDIT") }}
      </b-btn>
      <b-btn v-show="!isInstalled"
             variant="primary" size="sm" class="text-center installing"
             :disabled="installing || isInstalled"
             @click="handleInstall">
        {{ installing ?  $t("PLUGIN.TAB1_CONTENT.INSTALLING_TITLE") : $t("PLUGIN.TAB1_CONTENT.INSTALL") }}
      </b-btn>
      <b-btn v-show="isInstalled" variant="success" size="sm" class="text-center" style="margin-left: 20px" @click="handleShowExport" >
        {{ $t("PLUGIN.TAB1_CONTENT.EXPORT") }}
      </b-btn>
      <b-btn v-show="isInstalled" :disabled="!hasAuth('plugin:device:del')" variant="danger" size="sm" class="text-center" style="margin-left: 20px" @click="handleUninstall" >
        {{ $t("PLUGIN.TAB1_CONTENT.UNINSTALL") }}
      </b-btn>
    </b-card-text>


  </b-card>
</template>

<script>
import { MessageBox } from 'element-ui';
import {message_success} from "../../../../utils/helpers";
import PluginAPI from "@/api/plugin.js"
import { PluginType } from "../Const";
export default {
  name: "PluginCard",
  props: {
    data: {
      type: Object,
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
      pluginType: PluginType
    }
  },
  created() {
    this.pluginData = JSON.parse(JSON.stringify(this.data));
    console.log("===PluginCard.pluginData" , this.pluginData)
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
      // const jsonData = JSON.stringify(JSON.parse(this.pluginData['jsonData']), null, 4);
      this.$emit("export", this.pluginData)
    },
    /**
     * 卸载插件
     */
    handleUninstall() {
      MessageBox.confirm(this.$t('PLUGIN.TAB1_CONTENT.TIP_TEXT'), this.$t('PLUGIN.TAB1_CONTENT.TIP'), {
        confirmButtonText: this.$t('PLUGIN.TAB1_CONTENT.CONFIRM'),
        cancelButtonText: this.$t('PLUGIN.TAB1_CONTENT.CANCEL'),
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