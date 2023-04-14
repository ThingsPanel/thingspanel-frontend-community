<template>
  <video ref="myVideo" id="mmiid" class="video-js vjs-default-skin vjs-big-play-centered" 
    controls preload="auto" width="100%" height="100%"></video>
</template>

<script>
import Videojs from 'video.js'
import 'video.js/dist/video-js.css'
import "videojs-flvjs-es6";
import "videojs-flash";
export default {
  name: "VideoPlayer",
  props: {
    src: {
      type: [String],
      default: ""
    },
    type: {
      type: [String],
      default: "hls"
    },
    autoplay: {
      type: [Boolean],
      default: false
    },
    pic: {
      type: [String],
      default: ""
    },
  },
  data() {
    return {
      videoPlayer: null,
    }
  },
  watch: {
    src: {
      handler(newValue) {
        console.log("====video.watch.src", newValue)
        const src = newValue;
        if (src) {
          // 调用播放
          const basicOption = this.getBasicOption();
          const type = this.getSuffix(src);
          switch (type) {
            case "m3u8": {
              const option = { ...basicOption, ...this.getHlsOption(src) };
              this.createPlayer(option, [{ src, type: 'application/x-mpegURL' }]);
              break;
            }
            case "flv": {
              const option = { ...basicOption, ...this.getFlvOption(src) };
              this.createPlayer(option, [{ src, type: 'video/x-flv' }]);
              break;
            }
            case "mp4": {
              const option = { ...basicOption, ...this.getMP4Option(src) };
              this.createPlayer(option, [{ src, type: 'video/mp4' }]);
              break;
            }
            case "rtmp": {
              const option = { ...basicOption, ...this.getRTMPOption(src) };
              this.createPlayer(option, [{ src, type: 'rtmp/flv' }]);
              break;
            }
          }


        }
      }
    }
  },
  beforeDestroy() {
    this.destroy();
  },
  methods: {
    createPlayer(option, src) {
      const context = this;
      this.$nextTick(() => {
        if (!this.videoPlayer) {
          this.videoPlayer = Videojs(this.$refs.myVideo, option,
            function onPlayerCallback() {
              this.on('suspend', function () {//延迟下载
                console.log("====延迟下载")
              });
              this.on('loadstart', function () { //客户端开始请求数据
                console.log("====客户端开始请求数据", context.src)
              });
              this.on('progress', function () {//客户端正在请求数据
                console.log("====客户端正在请求数据", context.src)
                context.$emit("callback", "progress");
              });
              this.on('error', function (err) {//请求数据时遇到错误
                console.log("====请求数据时遇到错误", err)
              });
              this.on('play', function () {//开始播放
                context.$emit("callback", "play");

              });
              this.on('pause', function () {//暂停
                context.$emit("callback", "pause");

              });
              this.on('loadedmetadata', function () {//成功获取资源长度
                console.log("====成功获取资源长度")
              });
              this.on('loadeddata', function () {//渲染播放画面
                console.log("====渲染播放画面")
              });
              this.on('waiting', function () {//等待数据，并非错误
                console.log("====等待数据")
              });
              this.on('playing', function () {//开始回放
                console.log("====开始回放")
              });
              this.on('canplay', function () {//可以播放，但中途可能因为加载而暂停
                console.log("====可以播放，但中途可能因为加载而暂停")
              });
              this.on('canplaythrough', function () { //可以播放，歌曲全部加载完毕
                console.log("====可以播放，歌曲全部加载完毕")
              });
              this.on('seeked', function () {//寻找完毕
                console.log("====寻找完毕")
              });
              this.on('timeupdate', function () {//播放时间改变
                console.log("====播放时间改变")
              });
              this.on('ended', function () {//播放结束
                console.log("====播放结束")
                context.$emit("callback", "ended");
              });
            }
          );
        }
        
        this.videoPlayer.src(src);
        this.videoPlayer.play();
      })
    },
    getBasicOption() {
      return {
        autoplay: 'muted',//自动播放
        controls: true,//用户可以与之交互的控件
        loop: true,//视频一结束就重新开始
        muted: false,//默认情况下将使所有音频静音
        aspectRatio: "16:9",//显示比率
        fluid: true,
        width: '100%',
        height: '100%',
        fullscreen: {
          options: { navigationUI: 'hide' }
        },
      }
    },
    getRTMPOption() {
      return {
        techOrder: ["html5", "flash"],
        flash: { hls: { withCreadentials: false } }
      };
    },
    getHlsOption() {
      return {
        techOrder: ["html5", "flvjs"],// 兼容顺序
        html5: {
          hls: {
            overrideNative: true,
            isLive: false,
            cors: true,
            withCredentials: false
          }
        }
      };
    },
    getFlvOption() {
      return {
        techOrder: ["html5", "flvjs"],// 兼容顺序
        flvjs: {
          mediaDataSource: {
            isLive: false,
            cors: true,
            withCredentials: false
          }
        }
      };
    },
    getMP4Option() {
      return {
        techOrder: ["html5", "flvjs"],// 兼容顺序
        flvjs: {
          mediaDataSource: {
            isLive: false,
            cors: true,
            withCredentials: false
          }
        }
      }
    },
    
    play() {
      if (this.videoPlayer) {
        this.videoPlayer.play();
      }
    },
    pause() {
      if (this.videoPlayer) {
        this.videoPlayer.pause();
      }
    },
    /**
     * 销毁播放器
     */
    destroy() {
      if (this.videoPlayer) {
        this.videoPlayer.dispose()
        this.videoPlayer = null;
        console.log("====销毁播放器");
      }
    },
    getSuffix(src) {
      let suffix = "";
      if (src) {
        if (src.startsWith("rtmp://")) {
          return "rtmp";
        }
        suffix = this.src.substring(this.src.lastIndexOf(".") + 1);
        suffix = suffix.toLowerCase();
      }
      return suffix;
    }
  }
}

const playerCallback = function (context) {
  this.on('suspend', function () {//延迟下载
    console.log("====延迟下载")
  });
  this.on('loadstart', function () { //客户端开始请求数据
    console.log("====客户端开始请求数据", context.src)
  });
  this.on('progress', function () {//客户端正在请求数据
    console.log("====客户端正在请求数据", context.src)
  });
  this.on('abort', function () {//客户端主动终止下载（不是因为错误引起）
    console.log("====客户端主动终止下载")
  });
  this.on('error', function (err) {//请求数据时遇到错误
    console.log("====请求数据时遇到错误", err)
  });
  this.on('stalled', function () {//网速失速
    console.log("====网速失速")
  });
  this.on('play', function () {//开始播放
    console.log("====开始播放", context.src)
  });
  this.on('pause', function () {//暂停
    console.log("====暂停")
  });
  this.on('loadedmetadata', function () {//成功获取资源长度
    console.log("====成功获取资源长度")
  });
  this.on('loadeddata', function () {//渲染播放画面
    console.log("====渲染播放画面")
  });
  this.on('waiting', function () {//等待数据，并非错误
    console.log("====等待数据")
  });
  this.on('playing', function () {//开始回放
    console.log("====开始回放")
  });
  this.on('canplay', function () {//可以播放，但中途可能因为加载而暂停
    console.log("====可以播放，但中途可能因为加载而暂停")
  });
  this.on('canplaythrough', function () { //可以播放，歌曲全部加载完毕
    console.log("====可以播放，歌曲全部加载完毕")
  });
  this.on('seeking', function () { //寻找中
    console.log("====寻找中")
  });
  this.on('seeked', function () {//寻找完毕
    console.log("====寻找完毕")
  });
  this.on('timeupdate', function () {//播放时间改变
    console.log("====播放时间改变")
  });
  this.on('ended', function () {//播放结束
    console.log("====播放结束")
  });
  this.on('ratechange', function () {//播放速率改变
    console.log("====播放速率改变")
  });
  this.on('durationchange', function () {//资源长度改变
    console.log("====资源长度改变")
  });
  this.on('volumechange', function () {//音量改变
    console.log("====音量改变")
  });
}
</script>

<style lang="scss" scope>
::v-deep .video-js {
  width: 100% !important;
  height: 100% !important;
  object-fit: fill !important;
  .vjs-big-play-button {
    font-size: 2.5em !important;
    line-height: 2.3em !important;
    height: 2.5em !important;
    width: 2.5em !important;
    -webkit-border-radius: 2.5em !important;
    -moz-border-radius: 2.5em !important;
    border-radius: 2.5em !important;
    background-color: #73859f;
    background-color: rgba(115, 133, 159, 0.5) !important;
    border-width: 0.15em !important;
    margin-top: -1.25em !important;
    margin-left: -1.75em !important;
  }
}


::v-deep .vjs-big-play-button .vjs-icon-placeholder {
  font-size: 1.63em !important;
}
::v-deep .video-js.vjs-paused .vjs-big-play-button {
  display: block !important;
}
</style>