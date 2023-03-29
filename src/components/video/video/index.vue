<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-29 14:56:28
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-29 18:57:15
 * @FilePath: \ThingsPanel-Backend-Vue\src\components\video\video\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
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
  beforeDestroy() {
    this.destroy();
  },
  methods: {
    createPlayer() {
      this.player = new WasmPlayer(null, 'Player', this.callbackFun, {Height: true, openAudio: false})
    },
    callbackFun(e) {
      this.$emit("callback", e);
    },
    destroy() {
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }
    }
  }
}
</script>

<style scoped lang="scss">
  #Player {
    width: 100%;
    height: 100%;
  }
</style>