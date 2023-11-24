<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-10-12 20:48:45
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-24 16:37:24
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\console\components\StatusIcon.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="status-icon">
    <el-tooltip class="item" effect="dark" :content="lastPushTime" placement="left">
        <el-button class="tool-item" size="mini">
            <img v-if="status.status" src="./signal_status_on.svg" alt="">
            <img v-else src="./signal_status_off.svg" alt="">
        </el-button>
    </el-tooltip>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
    status: {
        type: [Boolean, Object],
        default: () => ({ status: false, lastPushTime: "无"})
    },
    
    systime: {
        type: [String],
        default: ""
    }
  },
  data() {
    return {
        lastPushTime: this.$t('VISUALIZATION.CONSOLE.LAST_PUSH_TIME') + ": None"
    }
  },
  methods: {
    flush() {
        this.lastPushTime = this.$t('VISUALIZATION.CONSOLE.LAST_PUSH_TIME') + ': '+ this.status.lastPushTime;
    }
  }
}
</script>
<style lang="scss" scoped>
.status-icon {
    // display: flex;
    //width: 30px; 
    height: 100%;
    padding-left: 10px;
    align-items: center;
    .tool-item {
        background: transparent !important;
        border: 0px solid transparent;
      }
    img {
        width: 16px;
        height: 16px;
    }
}

</style>