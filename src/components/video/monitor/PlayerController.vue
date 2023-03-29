<template>
  <div class="controller-container">
    <div class="ptz-box">
      <div class="pt-box">
        <img class="img-full" :src="require('@/assets/images/video_control/direction-control.png')">
        <img class="img-up" :src="require('@/assets/images/video_control/up.png')"
             @mousedown="handleCommand('up')"
             @mouseup="handleCommand('stop')">
        <img class="img-down" :src="require('@/assets/images/video_control/up.png')"
             @mousedown="handleCommand('down')"
             @mouseup="handleCommand('stop')">
        <img class="img-left" :src="require('@/assets/images/video_control/up.png')"
             @mousedown="handleCommand('left')"
             @mouseup="handleCommand('stop')">
        <img class="img-right" :src="require('@/assets/images/video_control/up.png')"
             @mousedown="handleCommand('right')"
             @mouseup="handleCommand('stop')">
      </div>
      <div class="zoom-box">
        <el-button icon="el-icon-plus" size="mini"
                   @mousedown="handleCommand('zoomIn')"
                   @mouseup="handleCommand('stop')"></el-button>
        <el-button icon="el-icon-minus" size="mini"
                   @mousedown="handleCommand('zoomOut')"
                   @mouseup="handleCommand('stop')"></el-button>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "PlayerController",
  methods: {
    handleCommand(command) {
      this.$emit(command);
      this.$emit("command", command);
    }
  }
}
</script>

<style scoped lang="scss">
.controller-container {
  width: 100px;
  height: 100%;
  display: table;
  .ptz-box {
    width: 100%;
    display: table-cell;
    vertical-align: middle;
    .pt-box {
      position: relative;
      width: 100%;
      .img-full {
        //position: absolute;
        width: calc(100% - 4px);
        top: 0;
        left: 0px;
      }
      .img-up {
        position: absolute;
        cursor: pointer;
        top: 4px;
        left: calc(50% - 15px);
        width: 30px;
      }
      .img-down {
        position: absolute;
        cursor: pointer;
        bottom: 4px;
        left: calc(50% - 15px);
        width: 30px;
        transform:rotateY(180deg);
        -moz-transform:rotate(180deg);
        -webkit-transform:rotate(180deg);
      }
      .img-left {
        position: absolute;
        cursor: pointer;
        top: calc(50% - 15px);
        left: 4px;
        width: 30px;
        transform:rotateY(-90deg);
        -moz-transform:rotate(-90deg);
        -webkit-transform:rotate(-90deg);
      }
      .img-right {
        position: absolute;
        cursor: pointer;
        top: calc(50% - 15px);
        right: 4px;
        width: 30px;
        transform:rotateY(90deg);
        -moz-transform:rotate(90deg);
        -webkit-transform:rotate(90deg);
      }
    }
    .zoom-box {
      width: 100%;
      height: 40px;
      margin-top: 10px;
      .el-button--mini, .el-button--mini.is-round {
        padding: 2px 9px;
      }
    }
  }
}

</style>