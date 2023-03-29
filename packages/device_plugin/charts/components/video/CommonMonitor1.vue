<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 09:08:53
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-29 11:31:33
 * @FilePath: \ThingsPanel-Backend-Vue\packages\device_plugin\charts\components\video\CommonMonitor1.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div class="common-video-container">
      <video-player  :src="optionData.src" type="application/x-mpegURL"/>
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
import i18n from "@/core/plugins/vue-i18n.js"
const required = true;
export default {
  name: "CommonVideo",
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
        name: ""
      },
      formRule: {
        "name": [{required, message: i18n.t('PLUGIN.CHART_INFO_TAB.TAB_TITLE26')}],
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
      this.$emit("submit", this.optionData)
      // 关闭绑定对话框
      this.handleClose();
    }
  }

}
</script>

<style scoped>
.common-video-container {
  width: 100%;
  height: 100%;
}
</style>