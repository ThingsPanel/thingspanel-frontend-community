<template>
  <div class="rounded p-4 card no-border v-application" data-app="true">
    <div class="image-marker-warp">
      <img
        :src="urlImage"
        :style="posStyle"
        class="image"
        @load="onImageLoad"
      />
      <div :style="posStyle" class="mark-container">
        <div
          v-for="(marker, index) in markers"
          :key="index"
          :style="{
            left: `calc(${marker.x * 100}% - 5px)`,
            top: `calc(${marker.y * 100}% - 5px)`,
          }"
          class="tooptip-wrap"
        >
          <el-tooltip placement="bottom" effect="light">
            <el-button class="tooptip-btn">
              <img :src="onlineImage" v-if="marker.status == 1" class="marker" />
              <img :src="offlineImage" v-if="marker.status == 2" class="marker" />
              <img :src="unuseImage" v-if="marker.status == 0" class="marker" />
              <span class="text"> {{ marker.title }}</span>
            </el-button>
            <div slot="content">
              <div class="box-card">
                <div class="clearfix card-header1">
                  <el-row>
                    <el-col :span="12"
                      ><div class="grid-content">
                        {{ marker.title }}
                      </div></el-col
                    >
                    <el-col :span="12">
                      <div class="grid-content">
                        <span v-if="marker.status == 1">在线</span>
                        <span v-else>离线</span>
                      </div></el-col
                    ></el-row
                  >
                </div>
                <div class="card-content1">
                  <el-row>
                    <el-col :span="12"
                      ><div class="grid-content">
                        温度:{{ marker.temperature }}
                      </div></el-col
                    >
                    <el-col :span="12"
                      ><div class="grid-content">
                        噪音:{{ marker.noise }}
                      </div></el-col
                    ></el-row
                  >
                  <el-row>
                    <el-col :span="12"
                      ><div class="grid-content">
                        湿度:{{ marker.humidity }}
                      </div></el-col
                    >
                    <el-col :span="12"
                      ><div class="grid-content">
                        电量:{{ marker.status }}
                      </div></el-col
                    >
                  </el-row>
                </div>
              </div>
            </div>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _debounce from "lodash.debounce";

const LAYOUT_REFRESH_DELAY = 100;
export default {
  name: "Overiew",
  data() {
    return {
      urlImage: "/media/bg/dimarer_bg.png",
      onlineImage: "/media/bg/dimarer_bg_online.png",
      offlineImage: "/media/bg/dimarer_bg_online.png",
      unuseImage: "/media/bg/dimarer_bg_unuse.png",
      padding: 20,
      containerWidth: 1,
      containerHeight: 1,
      imageWidth: 1,
      imageHeight: 1,
      top: 0,
      left: 0,
      width: 1,
      height: 1,

      markers: [
        {
          x: 0.2,
          y: 0.5,
          color: "red",
          title: "test1",
          status: 1,
          temperature: 38,
          noise: 10,
          humidity: 80,
          electricity: 35,
        },
        {
          x: 0.5,
          y: 0.8,
          color: "gray",
          title: "test2",
          status: 0,
          temperature: 22,
          noise: 50,
          humidity: 30,
          electricity: 35,
        },
      ],
    };
  },
  watch: {
    padding: "refreshPos",
  },
  computed: {
    posStyle() {
      return {
        left: this.left + "px",
        top: this.top + "px",
        width: this.width + "px",
        height: this.height + "px",
      };
    },
  },
  mounted() {
    this.refreshPos();
    window.addEventListener("resize", this.refreshPos);
  },
  destroyed() {
    window.removeEventListener("resize", this.refreshPos);
  },
  methods: {
    onImageLoad(ev) {
      this.imageWidth = ev.currentTarget.naturalWidth;
      this.imageHeight = ev.currentTarget.naturalHeight;
      this.refreshPos();
    },
    // recalc left, top, width, height
    // Need a delay to wait the dom refreshing
    refreshPos: _debounce(function () {
      this.containerWidth = this.$el.clientWidth;
      this.containerHeight = this.$el.clientHeight;
      let clientWidth = this.containerWidth - this.padding * 2;
      let clientHeight = this.containerHeight - this.padding * 2;
      let clientRatio = clientWidth / clientHeight;
      let imageRatio = this.imageWidth / this.imageHeight;
      if (imageRatio > clientRatio) {
        // top & bottom padding
        this.width = clientWidth;
        this.left = this.padding;
        this.height = this.width / imageRatio;
        this.top = this.padding + (clientHeight - this.height) / 2;
      } else {
        // left & right padding
        this.height = clientHeight;
        this.top = this.padding;
        this.width = this.height * imageRatio;
        this.left = this.padding + (clientWidth - this.width) / 2;
      }
    }, LAYOUT_REFRESH_DELAY),
  },
};
</script>

<style scoped>
.image-marker-warp {
  /* width: 100vh; */
  height: 100vh;
  width: 100%;
  border: solid 1px silver;
  user-select: none;
  background-color: #f8f8f8;
}

.image-marker {
  position: relative;
  min-width: 200px;
  min-height: 200px;
}
.image {
  position: absolute;
}
.mark-container {
  position: absolute;
  width: 100%;
  height: 100%;
}

/* .marker-wrap {
  position: absolute;
  cursor: pointer;
} */

.marker-tooltip-content {
  padding: 0 !important;
}

.marker {
  width: 10px;
  height: 10px;
  margin: 0 auto;
  border-radius: 6px;
}

.tooptip-wrap {
  position: absolute;
  cursor: pointer;
}

.tooptip-btn {
  border: 0;
  background: none;
}

.tooptip-btn .marker {
  width: 10px;
  height: 10px;
  display: block;
  margin: 0 auto;
  border-radius: 6px;
  border: solid 1px silver;
}

.tooptip-btn .text {
  margin-top: 2px;
  display: block;
  padding: 2px 10px;
  background-color: #f8f8f8;
  color: black;
}

.box-card {
  padding: 0 !important;
}
.box-card .card-header1 {
  border-bottom: 1px solid gray;
}
.box-card .card-header1,
.box-card .card-content1 {
  min-width: 200px;
  height: 30px;
  line-height: 30px;
  padding-left: 10px;
}
</style>
