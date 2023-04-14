<template>
  <div class="chart-div">
    <div class="chart-header" v-if="showHeader">
      <span class="title">{{ optionData.name }}</span>
      <div class="tool-right" v-if="optionData.type=='monitor'">
        <el-button class="tool-item" :class="monitorType==='control' ? 'selected' : ''" size="mini" 
          @click="handleChangeMonitorType('control')">控制</el-button>

        <el-button class="tool-item" :class="monitorType==='record' ? 'selected' : ''" size="mini" 
          @click="handleChangeMonitorType('record')">回放</el-button>

        <el-button class="tool-item" :class="monitorType==='default' ? 'selected' : ''" size="mini" 
          @click="handleChangeMonitorType('default')">默认</el-button>

        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
      </div>
    </div>

    <div class="video-box" ref="videoBox">


      <video-player ref="videoPlayer" style="width: 100%;height: 100%" 
        v-if="optionData.type=='video'"
        :src="optionData.src"
        ></video-player>

      <monitor-player ref="monitorPlayer" style="width: 100%;height: 100%" 
        v-if="optionData.type=='monitor'" :type="monitorType" :device="device"
        ></monitor-player>

      <ezviz-player ref="ezvizPlayer" style="width: 100%;height: 100%" 
        v-if="optionData.type=='ezviz'" :src="optionData.src" :appKey="optionData.appKey" :appSecret="optionData.appSecret"
        ></ezviz-player>

    </div>

  </div>
</template>

<script>
import ProtocolPluginAPI from "@/api/protocolPlugin"
import VideoPlayer from "@/components/video/video";
import MonitorPlayer from "@/components/video/monitor";
import EzvizPlayer from "@/components/video/ezviz";

export default {
  name: "Video",
  components: {
    VideoPlayer, MonitorPlayer, EzvizPlayer
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
      optionData: {},
      monitorType: "default"
    }
  },
  mounted() {
  },
  watch: {
    option: {
      handler(newValue) {
        if (newValue) {
          let additionalInfo = (this.device.additional_info && this.device.additional_info != "null") ? JSON.parse(this.device.additional_info) : {};
          this.optionData = JSON.parse(JSON.stringify(newValue))
          if (this.optionData.type === "video") {
            setTimeout(() => {
              this.optionData.src = additionalInfo.video_address ? additionalInfo.video_address : "";
            }, 50)
          } else if (this.optionData.type === "ezviz") {
            setTimeout(() => {
              this.optionData.src = additionalInfo.video_address ? additionalInfo.video_address : "";
              this.optionData.appKey = additionalInfo.app_key ? additionalInfo.app_key : "";
              this.optionData.appSecret = additionalInfo.secret ? additionalInfo.secret : "";
            }, 50)
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 切换监控类型
     * @param type
     */
    handleChangeMonitorType(type) {
      this.monitorType = type;
    },
    sizeChange() {
      let videoBox = this.$refs.videoBox;
    },
    nodeChanged() {
      this.$refs.videoPlayer.destroy();
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
      color: #ffffff;
      background: transparent !important;
      border: 0px solid transparent;
    }
    .selected {
      color: #2d3d86;
      background: #ffffff !important;
      border: 0px solid transparent;
    }
  }

  .video-box {
    width: 100%;
    height: calc(100% - 40px);
    padding: 10px;
  }
}


</style>