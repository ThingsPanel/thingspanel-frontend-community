<template>
  <div class="chart-div">
    <div  v-if="showHeader" class="chart-header">
      <span class="title">{{ option.name }}</span>
      <div class="tool-right">
        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
      </div>
    </div>

    <common-device-status :option="optionData" :value="statusText" :push-time="pushTime"></common-device-status>
  </div>

</template>

<script>
import { addTimer, clearTimer } from "@/utils/tool.js"
import {currentValue} from "@/api/device";
export default {
  name: "DeviceStatus",
  props: {
    showHeader: {
      type: [Boolean],
      default: false
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
      pushTime: ""
    }
  },
  watch: {

  },
  mounted() {
    this.optionData = JSON.parse(JSON.stringify(this.option));
    this.updateOption();
  },
  beforeDestroy() {
    clearTimer();
  },
  methods: {
    updateOption() {
      if (this.timer) {
        clearInterval(this.timer);
      }
      let deviceId = this.device.device;
      let attrs = this.option.mapping;
      this.getValue(deviceId, attrs);
      this.timer = setInterval(() => {
        this.getValue(deviceId, attrs);
      }, this.flushTime * 1000);
      addTimer(this.timer);
    },
    getValue(deviceId) {
      currentValue({ entity_id: deviceId })
          .then(({data}) => {
            if (data.code == 200 && data.data) {
              let lastTime = data.data[0]["systime"];
              let now = new Date();
              let diff = new Date(now) - new Date(lastTime);
              if (diff > (this.optionData.thresholdTime * 1000)) {
                this.statusText = "离线"
              } else {
                this.statusText = "在线"
              }
              this.pushTime = lastTime;
              console.log(diff)

            }
          })
    },
    sizeChange() {

    }
  }
}

</script>

<style scoped lang="scss">
.chart-div {
  position: relative;
  margin: 10px 20px 10px 10px;
  border-radius: 16px;
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
  box-shadow: 0 2px 0px 0 rgba(0, 0, 0, 0.1);
  .title {
    //width: 100%;
    //flex-grow: 1;
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