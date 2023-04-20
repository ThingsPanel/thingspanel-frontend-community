<template>
  <div class="chart-div">
    <div  v-if="showHeader" class="chart-header">
      <span class="title">{{ option.name }}</span>
      <div class="tool-right">
        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
      </div>
    </div>

    <common-status :option="optionData"></common-status>
  </div>

</template>

<script>
import { addTimer, clearTimer } from "@/utils/tool.js"
import {currentValue} from "@/api/device";
export default {
  name: "StatusIndex",
  props: {
    displayData: {
      type: [Boolean],
      default: false
    },
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
      flushTime: 5
    }
  },
  watch: {

  },
  mounted() {
    console.log("mounted", this.option);
    console.log("device", this.device);
    this.optionData = JSON.parse(JSON.stringify(this.option));
    if (!this.displayData) return;
    this.updateOption();
  },
  beforeDestroy() {
    console.log("beforeDestroy")
    if (!this.displayData) return;
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
    getValue(deviceId, attrs) {
      console.log(deviceId)
      console.log(attrs)
      currentValue({entity_id: deviceId, attribute: attrs})
          .then(({data}) => {
            if (data.code == 200 && data.data) {
              let value = data.data[0][attrs[0]]
              console.log(value)
              this.optionData = {series: { value }}
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
  //margin: 10px 20px 10px 10px;
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
  position: relative;
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