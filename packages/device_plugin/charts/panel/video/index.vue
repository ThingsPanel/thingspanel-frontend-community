<template>
  <div class="video-container">
    <div class="player-item">
    </div>
  </div>
</template>

<script>
export default {
  name: "VideoPanel",
  components:{
  },
  data() {
    return {
      options: { width: '100%', height:'100%'},
    }
  },
  methods: {
    handleClick() {
    }
  }
}
</script>

<style scoped>
.video-container {
  width: 1000px;
}
.player-item {
  width: 300px;
  height: 300px;
  padding: 30px
}
.tc-player {
  width: 240px;
  height: 240px;
}
</style>