<template>
  <div class="chart-div"  >
    <div  v-if="showHeader" class="chart-header">
      <dashboard-title :mode="mode" :value.sync="optionData.name"></dashboard-title>

      <div class="tool-right" v-if="mode!=='edit'">
        <status-icon ref="statusIconRef" :status="deviceStatus"/>
        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
      </div>
      <div v-else class="tool-right">
        <el-button v-if="showConfig" class="tool-item" style="padding-top: 2px" size="mini" icon="el-icon-setting" @click="showConfiguration"/>
        <slot ></slot>
      </div>
    </div>

    <common-status :option="option" :value="value" @click="handleClick"></common-status>
  </div>

</template>

<script>
import StatusIcon from "./StatusIcon.vue";
import DashboardTitle from "./DashboardTitle.vue"
import { commonProps } from "./Const";

export default {
  name: "StatusIndex",
  components: { StatusIcon, DashboardTitle  },
  props: {
    ...commonProps
  },
  data() {
    return {
      timer: null,
      flushTime: 5,
      value: null,
      deviceStatus: {}
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
      try {
        this.value = value[0].value;
        this.$refs.statusIconRef.flush();
      } catch (e) {
        console.log(e)
      }
    },
    sizeChange() {
    },
    handleClick() {
      if (this.$slots.default && this.$slots.default.length) {
        this.$emit("update:select", !this.select)
      }
    },
    showConfiguration() {
      this.$emit("config", this.option)
    },
    /**
     * @description: 更新图表状态
     * @param {*} deviceStatus
     * @return {*}
     */    
     updateStatus(deviceStatus) {
      this.deviceStatus = deviceStatus;
    },
  }
}

</script>

<style scoped lang="scss">
.chart-div {
  position: relative;
  left: 0;
  right: 0;
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
  position: relative;
  display: flex;
  width: 100%;
  height: 40px;
  padding-left: 10px;
  text-align: right;
  z-index: 9999;
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
    display: flex;
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