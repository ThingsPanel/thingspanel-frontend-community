<template>
    <div class="chart-div"  :style="getChartStyle()" >
        <div  v-if="showHeader" class="chart-header">
          <dashboard-title :mode="mode" :value.sync="optionData.name"></dashboard-title>

          <div class="tool-right" v-if="mode!=='edit'">
            <status-icon ref="statusIconRef" :status="status"/>
            <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
          </div>
          <div v-else class="tool-right">
            <el-button v-if="showConfig" class="tool-item" style="padding-top: 2px" size="mini" icon="el-icon-setting" @click="showConfiguration"/>
            <slot ></slot>
          </div>
        </div>
    
        <common-signal-status ref="signalStatusRef" :option="option" :value="statusValue" @click="handleClick"></common-signal-status>
      </div>
</template>

<script>
import StatusIcon from "./StatusIcon"
import DashboardTitle from "./DashboardTitle.vue"
import { commonProps } from "./Const";

export default {
  components: { StatusIcon, DashboardTitle  },
  props: {
    ...commonProps
  },
  data() {
    return {
        statusValue: false,
        optionData: {},
    }
  },
  watch: {
    "optionData.name": {
      handler(newValue) {
        if (!newValue) return;
        this.$emit("changeName", newValue)
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    updateOption(value) {
      console.log("SignalStatus.updateOption", value)
      if (typeof value === "boolean") {
        this.statusValue = value
      } else {
        this.statusValue = false
      }
      this.$refs['signalStatusRef'].updateValue(statusValue);
      this.$refs['statusIconRef'].flush();
    },
    handleClick() {
      if (this.$slots.default && this.$slots.default.length) {
        this.$emit("update:select", !this.select)
      }
    },
    getChartStyle() {
      let style = this.optionData.style ? this.optionData.style : {};
      let backgroundColor = style.backgroundColor ? style.backgroundColor : "#2d3d86";
      return {
        backgroundColor
      }
    },
    showConfiguration() {
      this.$emit("config", this.option)
    },
    sizeChange() {
    }
  }
}
</script>
<style lang="scss" scoped>
.chart-div {
  position: relative;
  left: 0;
  right: 0;
  //margin: 10px 20px 10px 10px;
  border-radius: 4px;
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
  z-index: 9999;
  
  .tool-right {
    position: absolute;
    text-align: center;
    display: flex;

    top:4px;
    right: 4px;
  }
  .tool-item {
    background: transparent!important;
    border: 0px solid transparent;
  }
}

</style>