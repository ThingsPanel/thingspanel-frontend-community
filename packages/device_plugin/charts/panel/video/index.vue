<template>
  <div class="video-container">
    <div class="video-item-list">
      <div class="video-item" v-for="(option, index) in charts" :key="index" @click="showDialog(option)">
        <div class="video-item-header" >{{ option.title }}</div>
        <common-video :ref="'video_' + option.index" :option="option" @submit="handleSubmit"></common-video>
      </div>
    </div>

  </div>
</template>

<script>
import CommonVideo from "../../components/video/CommonVideo";
export default {
  name: "VideoPanel",
  components:{
    CommonVideo
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
}

</style>