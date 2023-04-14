<template>
    <div id="video-container"></div>
</template>

<script>
import EZUIKit from 'ezuikit-js';

import axios from 'axios';
export default {
  components: {},
  props: {},
  data() {
    return {
        player: null
    }
  },
  async mounted() {
    const accessToken = await this.getAccessToken();
    this.createPlayer(accessToken);
  },
  methods: {
    createPlayer(accessToken) {
        console.log('accessToken', accessToken)
        this.player = new EZUIKit.EZUIKitPlayer({
            id: 'video-container', // 视频容器ID
            width: 600,
            height: 400,
            accessToken,
            url: 'ezopen://open.ys7.com/G39444019/1.rec'
        });
    },
    async getAccessToken() {
        const appKey = "fae13a431561498f8bdb4a5d50e75fd5";
        const appSecret = "7ed43701fcbacd2bc0d0444375496570";
        let {data: result} = await axios.post("https://open.ys7.com/api/lapp/token/get?appKey=" + appKey + "&appSecret=" + appSecret)
        console.log(result.data)
        const { accessToken } = result.data;
        return accessToken;
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