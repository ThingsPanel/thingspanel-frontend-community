<template>
    <div id="video-container"></div>
</template>

<script>
import EZUIKit from 'ezuikit-js';

import axios from 'axios';
export default {
  components: {},
  props: {
    src: {
      type: [String],
      default: ""
    },
    appKey: {
        type: [String],
        default: ""
    },
    appSecret: {
        type: [String],
        default: ""
    }
  },
  data() {
    return {
        player: null,
    }
  },
  mounted() {
    // this.createPlayer();  
  },
  watch: {
    src: {
        handler(newValue) {
            if (newValue) {
                this.getAccessToken();
            }
        }
    }
  },
  beforeDestroy() {
    this.destroy();
  },
  methods: {
    createPlayer(accessToken) {
        this.player = new EZUIKit.EZUIKitPlayer({
            id: 'video-container', // 视频容器ID
            accessToken,
            url: this.src
        });
            
    },
    async getAccessToken() {
        let { data: result } = await axios.post(
            "https://open.ys7.com/api/lapp/token/get?appKey=" + this.appKey + "&appSecret=" + this.appSecret)
        const { accessToken } = result.data;
        this.createPlayer(accessToken);
    },
    destroy() {
        this.player.stop();
        var destroyPromise = this.player.destroy();
        destroyPromise.then((data) => {
            console.log("销毁播放器", data)
        })
    }
  }
}
</script>
<style lang="scss" scoped>
#video-container {
  width: 100%;
  height: 100%;
}
</style>