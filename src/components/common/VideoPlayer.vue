<template>
  <div>
    <video ref="videoPlayer" class="video-js vjs-default-skin vjs-big-play-centered">
    </video>
  </div>
</template>

<script>
import videojs from 'video.js';
export default {
  name: "VideoPlayer",
  props: {
    src: {
      type: [String],
      default: ""
    },
    autoplay: {
      type: [Boolean],
      default: false
    }
  },
  data() {
    return {
      options: {
          "autoplay": false,
          "controls": true,
          "fluid": true,
          "language": "zh-CN",
          "sources": [],
          "notSupportedMessage": "此视频暂时无法播放，请稍后再试"
      },
      player: null
    }
  },
  mounted() {
    videojs.addLanguage('zh-CN', {
      'Play': '播放',
      'Pause': '暂停',
      'Replay': '重播',
      'Current Time': '当前时间',
      'Duration': '时长',
      'Mute': '静音',
      'Picture-in-Picture': '画中画',
      'Fullscreen': '全屏',
      'The media could not be loaded, either because the server or network failed or because the format is not supported.':
      '无法加载媒体, 可能是服务器或网络故障，或者格式不支持'
    });
    this.options.autoplay = this.autoplay;

    this.options.sources.push({ "src": this.src, "type": "video/mp4" })

    console.log("====VideoPlayer.options", this.options)

    this.player = videojs(this.$refs.videoPlayer, this.options, function onPlayerReady() {
      console.log('onPlayerReady', this);
    })

  },
  beforeDestroy() {
    if (this.player) {
      this.player.dispose()
    }
  }
}
</script>

<style scoped>
.video-js {
  /*max-width: 100vw!important;*/
  /*max-height: 100vh!important;*/
  background: content-box;
  position: static;
  padding: 10px;
  height: auto!important;
  /*aspect-ratio: 96/40;*/
}
</style>