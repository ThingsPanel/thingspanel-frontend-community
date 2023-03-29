<template>
  <div class="video-container">
    <div class="video-item-list">
      <div class="video-item" :style="option.style ? option.style : {}" v-for="(option, index) in charts" :key="index" @click="showDialog(option)">
        <div class="video-item-header" >{{ option.title }}</div>

        

        <video-player1 class="video-player" v-if="option.type == 'monitor'" :ref="'video_' + option.index" :option="option"
                        @submit="handleSubmit">
        </video-player1>

        <video-player2 class="video-player" v-if="option.type == 'monitor_control'" :ref="'video_' + option.index" :option="option"
                       @submit="handleSubmit">
        </video-player2>


        <video-player3 class="video-player" v-if="option.type == 'monitor_playback'" :ref="'video_' + option.index" :option="option"
                       @submit="handleSubmit">
        </video-player3>

      </div>
    </div>

  </div>
</template>

<script>
import VideoPlayer1 from "../../components/video/VideoPlayer1"
import VideoPlayer2 from "../../components/video/VideoPlayer2"
import VideoPlayer3 from "../../components/video/VideoPlayer3"

export default {
  name: "VideoPanel",
  components:{
    VideoPlayer1, VideoPlayer2, VideoPlayer3
  },
  props: {
    charts: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      options: { width: '100%', height:'100%'},
    }
  },
  methods: {
    showDialog(option) {
      this.$refs["video_" + option.index][0].showDialog(option);
    },
    handleSubmit(option) {
      this.$emit("submit", option);
    }
  }
}
</script>

<style scoped lang="scss">
.video-container {
  width: 1000px;
}
.video-item-list {
  display: flex;
  flex-flow: wrap;
  width: 1000px;
  height: 580px;
  float: left;
  overflow-y: auto;
  margin: 0 auto;
}
.video-item {
  display: inline-block;
  width: 300px;
  height: 300px;
  margin: 6px;
  padding: 10px;
  text-align: center;
  justify-items: center;
  align-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
  background-color: #33459a !important;
  cursor:pointer;
  .video-item-header {
    height: 40px;
  }
  .video-player {
    width: 100%;
    height: calc(100% - 40px);
  }
}

</style>