<template>
  <div class="status-icon">
    <el-tooltip class="item" effect="dark" :content="lastPushTime" placement="top">
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
        lastPushTime: "上次推送时间: 无"
    }
  },
  methods: {
    flush() {
        this.lastPushTime = "上次推送时间: " + this.status.lastPushTime;
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