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
          class="marker-wrap"
          :style="{
            left: `calc(${marker.x * 100}% - 5px)`,
            top: `calc(${marker.y * 100}% - 5px)`,
          }"
        >
          <v-tooltip bottom content-class="marker-tooltip-content">
            <template v-slot:activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on">
                <div
                  class="marker"
                  :style="{
                    backgroundColor: marker.color,
                  }"
                ></div>
                <div class="marker-title">
                  {{ marker.title }}
                </div>
              </div>
            </template>
            <v-card class="card">
              <v-card-text>
                <v-container>
                  <v-row class="dialog-head">
                    <v-col cols="12" md="6" class="col-px-0">{{
                      marker.title
                    }}</v-col>
                    <v-col cols="12" md="6" class="col-px-0">
                      <span v-if="marker.status == 1">在线</span>
                      <span v-else>离线</span>
                    </v-col>
                  </v-row>
                  <v-row class="dialog-content">
                    <v-col cols="12" md="6" class="col-px-0"
                      >温度:{{ marker.temperature }}</v-col
                    >
                    <v-col cols="12" md="6" class="col-px-0"
                      >噪音:{{ marker.noise }}</v-col
                    >

                    <v-col cols="12" md="6" class="col-px-0"
                      >湿度:{{ marker.humidity }}</v-col
                    >
                    <v-col cols="12" md="6" class="col-px-0"
                      >电量:{{ marker.status }}</v-col
                    >
                  </v-row>
                </v-container>
              </v-card-text>
            </v-card>
          </v-tooltip>
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

.marker-wrap {
  position: absolute;
  cursor: pointer;
}

.marker {
  width: 10px;
  height: 10px;
  margin: 0 auto;
  border-radius: 6px;
  border: solid 1px silver;
}

.marker-tooltip-content {
  padding: 0 !important;
}

.marker-title {
  text-align: center;
  color: #f8f8f8;
}
.dialog-content {
  background-color: #f8f8f8;
}
</style>
