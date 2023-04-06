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
          this.destroy();
          this.createPlayer();
        }
        if (newValue) {
          // 调用播放
          this.play();
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.createPlayer();
  },
  methods: {
    /**
     * 创建播放器
     */
    createPlayer() {
      this.player = new WasmPlayer(null, 'Player', this.callbackFun, {Height: true, openAudio: false})
    },
    /**
     * 回调函数
     * @param e
     */
    callbackFun(e) {
      console.log('callbackFun', e);
      this.$emit("callback", e);
    },
    /**
     * 播放
     */
    play() {
      if (!this.player) {
        this.createPlayer();
      }
      setTimeout(() => {
        this.player.play(this.src, 1)
      }, 50);
    },
    /**
     * 销毁播放器
     */
     destroy() {
      if (!this.player) return;
      this.player.destroy();
      this.player = null;
    }
  },
  beforeDestroy() {
    this.destroy();
  }
}
</script>

<style scoped lang="scss">
  #Player {
    width: 100%;
    height: 100%;
  }
</style>