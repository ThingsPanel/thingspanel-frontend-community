<template>
  <div class="chart-div">
    <div class="chart-header" v-if="showHeader">
      <span class="title">{{ optionData.name }}</span>
      <div class="tool-right">
        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
      </div>
    </div>

    <div class="video-box" ref="videoBox">
      <video-player style="width: 100%;height: 100%" :src="optionData.src" :type="optionData.type"></video-player>
    </div>

  </div>
</template>

<script>
import VideoPlayer from "@/components/common/VideoPlayer";

export default {
  name: "Video",
  components: {
    VideoPlayer
  },
  props: {
    showHeader: {
      type: [Boolean],
      default: false
    },
    option: {
      type: [Object],
      default: () => {return {}}
    },
    device: {
      type: [Object],
      default: () => {return {}}
    }
  },
  data() {
    return {
      optionData: {}
    }
  },
  mounted() {

  },
  watch: {
    option: {
      handler(newValue) {
        if (newValue) {
          console.log("====option", newValue)
          let additionalInfo = this.device.additional_info ? JSON.parse(this.device.additional_info) : {};
          this.optionData = JSON.parse(JSON.stringify(newValue))
          if (newValue.type == "monitor") {
            this.optionData.type = "application/x-mpegURL";
          }
          this.optionData.src = additionalInfo.video_address ? additionalInfo.video_address : "";
        }
      },
      immediate: true
    }
  },
  methods: {
    sizeChange() {
      let videoBox = this.$refs.videoBox;
      console.log("====video.sizeChange()", videoBox.clientWidth, videoBox.clientHeight)

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
  .chart-header {
    //position: absolute;
    display: flex;
    width: 100%;
    height: 40px;
    padding-left: 10px;
    text-align: right;
    //box-shadow: 0 2px 0px 0 rgba(0, 0, 0, 0.1);

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

      top: 4px;
      right: 4px;
    }

    .tool-item {
      background: transparent !important;
      border: 0px solid transparent;
    }
  }

  .video-box {
    width: 100%;
    height: 100%;
    padding: 10px;
  }
}


</style>