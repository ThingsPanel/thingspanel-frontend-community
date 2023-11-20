<template>
  <div class="chart-div"  > 
    <div  v-if="showHeader" class="chart-header">
      <dashboard-title :mode="mode" :value.sync="optionData.name"></dashboard-title>

      <div class="tool-right" v-if="mode!=='edit'">
        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
      </div>
      <div class="tool-right">
        <slot></slot>
      </div>
    </div>

    <common-device-status :option="optionData" :value="statusText" :push-time="pushTime" @click="handleClick"></common-device-status>
  </div>

</template>

<script>
import DashboardTitle from "./DashboardTitle.vue"

export default {
  name: "DeviceStatus",
  components: { DashboardTitle },
  props: {
    mode: {
      type: [String],
      default: "view"
    },
    showHeader: {
      type: [Boolean],
      default: false
    },
    select: {
      type: [Boolean],
      default: true
    },
    option: {
      type: [Object],
      default: () => { return {} }
    },
    device: {
      type: [Object],
      default: () => { return {} }
    }
  },
  data() {
    return {
      optionData: {},
      timer: null,
      flushTime: 5,
      statusText: "离线",
      pushTime: "",
      deviceStatus: {}
    }
  },
  watch: {
    value: {
      handler(newValue) {
      }
    },
    "optionData.name": {
      handler(newValue) {
        if (!newValue) return;
        this.$emit("changeName", newValue)
      },
      immediate: true,
      deep: true
    }
  },
  mounted() {
    this.optionData = JSON.parse(JSON.stringify(this.option));
  },
  methods: {
    updateOption(values) {
      if (values) {
        let lastTime = values;
        let now = new Date();
        let diff = new Date(now) - new Date(lastTime);
        if (diff > (this.optionData.thresholdTime * 1000)) {
          this.statusText = "离线"
        } else {
          this.statusText = "在线"
        }
        this.pushTime = lastTime;
      } else {
        this.statusText = "离线";
        this.pushTime = "";
      }
    },
    /**
     * @description: 更新图表状态
     * @param {*} deviceStatus
     * @return {*}
     */    
     updateStatus(deviceStatus) {
      this.deviceStatus = deviceStatus;
    },
    sizeChange() {

    },
    handleClick() {
      if (this.$slots.default && this.$slots.default.length) {
        this.$emit("update:select", !this.select)
      }
    }
  }
}

</script>

<style scoped lang="scss">
.chart-div {
  position: relative;
  //margin: 10px 20px 10px 10px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #2d3d86;
  text-align: center;
  ::v-deep .status-container {
    p {
      color: #fff;
    }
  }
}
.chart-header {
  position: absolute;
  display: flex;
  width: 100%;
  height: 40px;
  padding-left: 10px;
  text-align: right;
  z-index: 9999;
  //box-shadow: 0 2px 0px 0 rgba(0, 0, 0, 0.1);
  .title {
    //width: 100%;
    //flex-grow: 1;
    display: flex;
    align-items: center;
    color: #fff;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 18px;
  }
  .tool-right {
    position: absolute;
    text-align: center;

    top:4px;
    right: 4px;
  }
  .tool-item {
    background: transparent!important;
    border: 0px solid transparent;
  }
}

</style>