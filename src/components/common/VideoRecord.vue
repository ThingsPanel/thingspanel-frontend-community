<template>
  <div class="video-control-container" id="recordBox">
    <div class="player-box">
      <video-player class="player" :src="src" @callback="playerCallback"></video-player>
    </div>
    <div v-if="showControl" class="control-box">
      <record-controller :records="recordList"
                         @change-date="handleChangeDate"
                         @play="handlePlayRecord"
      ></record-controller>
    </div>
  </div>
</template>

<script>
import VideoPlayer from "./VideoPlayer";
import RecordController from "./RecordController";
import ProtocolPluginAPI from "@/api/protocolPlugin"

const PlayerStatus = {
  PREPARED: 0,
  PLAYING: 1,
  PAUSED: 2,
  STOPED: 3,
  CLOSE: 4
}
export default {
  name: "VideoControl",
  components: { VideoPlayer, RecordController },
  props: {
    device: {
      type: [Object],
      default: () => {return {}}
    }
  },
  data() {
    return {
      src: "",
      recordList: [],
      playerStatus: PlayerStatus.PREPARED,
      showControl: true
    }
  },
  mounted() {
    const resizeObserver = new ResizeObserver(entries => {
      console.log("监听变化", entries)
      for (let entry of entries) {
        switch(entry.target) {
          case recordContainer: {
            let w = entry.contentRect.width;
            let h = entry.contentRect.height
            console.log("====record.监听变化", w, h)
            if (w < 300) {
              this.showControl = false;
            } else {
              this.showControl = true;
            }
          }
        }
      }
    })

    const recordContainer = document.getElementById("recordBox");
    resizeObserver.observe(recordContainer);

    window.addEventListener('beforeunload', e => {
      this.stopPlayRecord();

    })

  },
  beforeDestroy() {
    this.stopPlayRecord();
  },
  methods: {
    handleChangeDate(date) {
      let {parent_id, sub_device_addr} = this.device;
      let startTime = date + " 00:00:00";
      let endTime = date + " 23:59:59"
      this.getRecordList({ parent_id, sub_device_addr,  startTime, endTime});
    },
    getRecordList(params) {
      ProtocolPluginAPI.getRecordList(params)
        .then(({data}) => {
          if (data.code == 200) {
            this.recordList = data.data.recordList ? data.data.recordList : [];
          }
        })
    },
    handlePlayRecord(record) {
      const play = () => {
        let {parent_id, sub_device_addr} = this.device;
        let { startTime, endTime } = record;
        let params = { parent_id, sub_device_addr, startTime, endTime }

        ProtocolPluginAPI.getRecordURL(params)
            .then(({data}) => {
              if (data.code == 200) {
                let result = data.data;
                this.src = result.flv;
              }
            })
      }
      this.stopPlayRecord(play);
      // if (this.playerStatus == PlayerStatus.PLAYING) {
      //   this.stopPlayRecord(play);
      // } else {
      //   play();
      // }
    },
    playerCallback(e) {
      switch (e) {
        case "play": {
          this.playerStatus = PlayerStatus.PLAYING;
          break;
        }
        case "videoTimestamp": {
          this.playerStatus = PlayerStatus.PLAYING;
          break;
        }
        case "stop": {
          this.playerStatus = PlayerStatus.STOPED;
          break;
        }
        default: {
          this.playerStatus = PlayerStatus.PREPARED;
        }
      }
    },
    stopPlayRecord(call) {
      let {parent_id, sub_device_addr} = this.device;
      this.src = "";
      ProtocolPluginAPI.stopRecordPlay({parent_id, sub_device_addr})
          .then(({data}) => {
            console.log(data)
            call && call();
          })
    }
  }
}
</script>

<style scoped lang="scss">
.video-control-container {
  width: 100%;
  height: 100%;

  .player-box {
    float: left;
    display: table;
    width: calc(100% - 200px);
    height: 100%;
    .player {

    }
  }
  .control-box {
    float: right;
    width: 200px;
    height: 100%;
    background-color: #fff;
    overflow-y: auto;
  }
}
</style>