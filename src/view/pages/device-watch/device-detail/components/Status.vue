<template>
  <div class="chart-div">
    <div  v-if="showHeader" class="chart-header">
      <span class="title">{{ option.name }}</span>
      <div class="tool-right">
        <status-icon ref="statusIconRef" :status="status"/>
        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
      </div>
    </div>

    <common-status :option="option" :value="value"></common-status>
  </div>

</template>

<script>
import StatusIcon from "./StatusIcon.vue";

export default {
  name: "StatusIndex",
  components: { StatusIcon },
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
    },
    status: {
      type: [Boolean, Object],
      default: () => ({})
    }
  },
  data() {
    return {
      timer: null,
      flushTime: 5,
      value: null
    }
  },
  methods: {
    updateOption(value) {
      try {
        this.value = value[0].value;
        this.$refs.statusIconRef.flush();
      } catch (e) {
      }
    },
    sizeChange() {
    }
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