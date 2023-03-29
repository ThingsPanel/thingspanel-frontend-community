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


      <video-player  style="width: 100%;height: 100%" 
        v-if="optionData.type=='video'"
        :src="optionData.src"
        ></video-player>

      <monitor-player  style="width: 100%;height: 100%" 
        v-if="optionData.type=='monitor'" :type="monitorType"
        :src="optionData.src"  :device="device"
        @command="handleCommand"
        ></monitor-player>

    </div>

  </div>
</template>

<script>
import ProtocolPluginAPI from "@/api/protocolPlugin"
import VideoPlayer from "@/components/video/video";
import MonitorPlayer from "@/components/video/monitor";
export default {
  name: "Video",
  components: {
    VideoPlayer, MonitorPlayer
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
      params: {
        horizonSpeed: "30",
        verticalSpeed: "30",
        zoomSpeed: "30"
      },
      monitorType: "default"
    }
  },
  mounted() {
  },
  watch: {
    option: {
      handler(newValue) {
        console.log("====video.option", newValue, this.device);
        if (newValue) {
          let additionalInfo = (this.device.additional_info && this.device.additional_info != "null") ? JSON.parse(this.device.additional_info) : {};
        console.log("====video.option", additionalInfo);

          this.optionData = JSON.parse(JSON.stringify(newValue))

          this.params.sub_device_addr = this.device.sub_device_addr;
          this.params.parent_id = this.device.parent_id;
          if (this.device.protocol.startsWith("WVP_")) {
            this.callPlayWVP();
          }
          if (this.optionData.type === "video") {
            setTimeout(() => {
              this.optionData.src = additionalInfo.video_address ? additionalInfo.video_address : "";
            }, 500)
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 播放组件控制回调
     * @param command
     */
    handleCommand(command) {
      console.log("====video.handleCommand", command);
      this.params.command = command.toLowerCase();
      this.params.horizonSpeed = "30";
      this.params.verticalSpeed = "30";
      this.params.zoomSpeed = "30";

      ProtocolPluginAPI.commandPlayerPTZ(this.params)
        .then(({data}) => {
          console.log("====video.handleCommand", data);
        })
    },
    /**
     * 切换监控类型
     * @param type
     */
    handleChangeMonitorType(type) {
      this.monitorType = type;
    },
    sizeChange() {
      let videoBox = this.$refs.videoBox;
      console.log("====video.sizeChange()", videoBox.clientWidth, videoBox.clientHeight)
    },
    /**
     * 播放WVP直播流时需要调用一次
     */
    callPlayWVP() {
      ProtocolPluginAPI.callPlayWVP(this.params)
        .then(({data}) => {
          if (data.code == 200) {
            let result = data.data.data;
            if (!this.optionData.src) {
              this.optionData.src = result.flv;
            }
          }
        })
    },
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