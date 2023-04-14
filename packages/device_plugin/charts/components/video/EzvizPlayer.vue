<!-- 萤石云视频地址插件 -->
<template>
    <div class="common-video-container">
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
  import {message_error} from "@/utils/helpers";
  import i18n from "@/core/plugins/vue-i18n.js"
  const required = true;
  export default {
    name: "EzvizPlayer",
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