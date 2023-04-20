<template>
    <div id="Player"></div>
</template>

<script>
export default {
  name: "VideoPlayer",
  props: {
    src: {
      type: [String],
      default: ""
    },
    type: {
      type: [String],
      default: "video/mp4"
    },
    autoplay: {
      type: [Boolean],
      default: false
    }
  },
  data() {
    return {
      player: null,
    }
  },
  watch: {
    src: {
      handler(newValue) {
        console.log("====video.src", newValue)
        if (this.player) {
          this.player.destroy();
          this.player = new WasmPlayer(null, 'Player', this.callbackFun, {Height: true, openAudio: false})
        }
        if (newValue) {
          // 调用播放
          this.player.play(newValue, 1)
        }
      }
    }
  },
  mounted() {
    this.createPlayer();
  },
  methods: {
    createPlayer() {
      this.player = new WasmPlayer(null, 'Player', this.callbackFun, {Height: true, openAudio: false})
    },
    callbackFun(e) {
      console.log('callbackFun', e);
      this.$emit("callback", e);
    }
  },
  beforeDestroy() {
    this.player.destroy();
  }
}
</script>

<style scoped lang="scss">
  #Player {
    width: 100%;
    height: 100%;
  }
</style>