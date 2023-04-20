<template>
  <div class="video-control-container">
    <div class="player-box">
      <video-player class="player" :src="src"></video-player>
    </div>
    <div class="control-box">
      <player-controller @command="handleCommand"></player-controller>
<!--      <div class="pt-box" :style="{backgroundImage: url(require('@/assets/images/direction-control.png'))}"></div>-->
    </div>
  </div>
</template>

<script>
import VideoPlayer from "./VideoPlayer";
import PlayerController from "./PlayerController";
export default {
  name: "VideoControl",
  components: { VideoPlayer, PlayerController },
  props: {
    src: {
      type: [String],
      default: ""
    },
  },
  data() {
    return {

    }
  },
  methods: {
    handleCommand(command) {
      this.$emit(command);
      this.$emit("command", command);
    }
  }
}
</script>

<style scoped lang="scss">
.video-control-container {
  width: 100%;
  height: 100%;
  .player-box {
    display: table;
    float: left;
    width: calc(100% - 100px);
    .player {
      display: table-cell;
      vertical-align: middle;
    }
  }
  .control-box {
    float: right;
    width: 100px;
    height: 100%;
    background-color: #2c3e50;
  }
}
</style>