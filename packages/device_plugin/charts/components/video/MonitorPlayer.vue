<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-29 14:07:42
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-29 14:07:59
 * @FilePath: \ThingsPanel-Backend-Vue\packages\device_plugin\charts\components\video\MonitorPlayer.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!-- 播放组件1 -->
<template>
    <div class="common-video-container">
      <!-- <video-player  :src="optionData.src"/> -->
      <div class="player-box"></div>
      <el-dialog class="el-dark-dialog" :title="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE22')" width="500px"
                 :visible.sync="dialogVisible" :append-to-body="true" :close-on-click-modal="false"
                 :before-close="handleClose">
  
        <el-form class="el-dark-form" :model="optionData" :rules="formRule">
  
          <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE3')" prop="name">
            <el-input v-model="optionData.name"></el-input>
          </el-form-item>
  
        </el-form>
  
        <span slot="footer" class="dialog-footer">
            <el-button @click="handleClose">{{ $t('PLUGIN.CHART_INFO_TAB.CANCEL') }}</el-button>
            <el-button type="primary" @click="handleSubmit">{{ $t('PLUGIN.CHART_INFO_TAB.CONFIRM') }}</el-button>
        </span>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import VideoPlayer from "@/components/common/VideoPlayer.vue";
  import {message_error} from "@/utils/helpers";
  import i18n from "@/core/plugins/vue-i18n.js"
  const required = true;
  export default {
    name: "MonitorPlayer",
    components: {
      VideoPlayer
    },
    props: {
      options: {
        type: [Object],
        default: () => { return {} }
      }
    },
    data() {
      return {
        optionData: {
          name: "",
          src: ""
        },
        formRule: {
          "name": [{required, message: i18n.t('PLUGIN.CHART_INFO_TAB.TAB_TITLE24')}],
          "src": [{required, message: i18n.t('PLUGIN.CHART_INFO_TAB.TAB_TITLE25')}]
        },
        dialogVisible: false
      }
    },
    methods: {
      /**
       * 打开对话框
       * @param option
       */
      showDialog(option) {
        this.optionData = JSON.parse(JSON.stringify(option));
        // 打开绑定对话框
        this.dialogVisible = true;
      },
      /**
       * 关闭
       */
      handleClose() {
        // 关闭绑定对话框
        this.dialogVisible = false;
      },
      /**
       * 提交绑定
       */
      handleSubmit() {
        if (!this.optionData.name) {
          message_error("名称不能为空!");
          return;
        }
        this.$emit("submit", this.optionData)
        // 关闭绑定对话框
        this.handleClose();
      }
    }
  
  }
  </script>
  
  <style scoped lang="scss">
  .common-video-container {
    position: relative;
    width: 100%;
    height: 100%;
    .player-box {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: #000000;
    }
  }
  </style>