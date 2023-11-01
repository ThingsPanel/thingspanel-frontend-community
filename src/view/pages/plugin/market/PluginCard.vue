<template>
  <div>
    <b-card class="mb-5 text-center card-border margin-auto marketbox" v-bind:key="data.storeId" :title="pluginData.name"
      :img-src="'media/logos/wsd.png'" img-alt="Image" img-top tag="article">

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
        <el-button type="warning" @click="showDetail">{{ $t('PLUGIN.TAB2_CONTENT.DETAIL') }}</el-button>
        <el-button type="success" v-loading="installing" @click="handleInstall">{{ $t("PLUGIN.TAB1_CONTENT.INSTALL")
        }}</el-button>
      </b-card-text>

    </b-card>
    <Detail :visible.sync="detailDialogVisible" :url="detailUrl" :data="data"></Detail>
  </div>
</template>

<script>
import { message_success } from "@/utils/helpers";
import { message_error } from '../../../../utils/helpers';
import { PluginType } from "../Const.js"
import Detail from "./Detail.vue"
export default {
  name: "PluginCard",
  components: {Detail },
  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    category: {
      type: [Array],
      default: () => { }
    },
    isInstalled: {
      type: Boolean,
      default: false
    },
    pluginType: {
      type: String,
      default: "Device"
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
      detailUrl: "",
      detailDialogVisible: false
    }
  },
  created() {
    this.pluginData = JSON.parse(JSON.stringify(this.data));
  },
  methods: {
    /**
     * 显示详情
     */
    showDetail() {
      const url = "http://r.thingspanel.cn/detail?id=" + this.data.storeId + "&type=" + PluginType[this.pluginType]
      this.detailUrl = url
      this.detailDialogVisible = true
    },
    /**
     *
     * 一键安装
     */
    handleInstall() {
      this.installing = true
      this.$emit("install", this.pluginData, res => {
        this.installing = false;
        if (res.code === 200) {
          message_success(res.msg);
        } else {
          message_error(res.msg);
        }
      })
    },
    /**
     * 点击插件
     * @param item
     */
    clickPlugin(item) {
    },

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

.installing {}

.card-border {
  border: 1px solid #70A0ED !important;
}

.card-body {
  padding: 10px 0;
}
</style>