<template>
  <div class="rounded p-4 card no-border v-application" data-app="true">
    <v-image-marker class="image-marker" :src="urlImage" :padding="padding">
      <div
        v-for="(marker, index) in markers"
        :key="index"
        class="marker-wrap"
        :style="{
          left: `calc(${marker.x * 100}% - 5px)`,
          top: `calc(${marker.y * 100}% - 5px)`,
        }"
      >
        <div
          class="marker"
          :style="{
            backgroundColor: marker.color,
          }"
        ></div>
        <div class="marker-title" @click="showMessage(marker)">
          {{ marker.title }}
        </div>
      </div>
    </v-image-marker>

    <v-dialog v-model="dialogVisible" max-width="500px">
      <v-card class="card">
        <v-card-text>
          <v-container>
            <v-row class="dialog-head">
              <v-col cols="12" md="6" class="col-px-0">{{
                dialogInfo.title
              }}</v-col>
              <v-col cols="12" md="6" class="col-px-0">
                <span v-if="dialogInfo.status == 1">在线</span>
                <span v-else>离线</span>
              </v-col>
            </v-row>
            <v-row class="dialog-content">
              <v-col cols="12" md="6" class="col-px-0"
                >温度:{{ dialogInfo.temperature }}</v-col
              >
              <v-col cols="12" md="6" class="col-px-0"
                >噪音:{{ dialogInfo.noise }}</v-col
              >

              <v-col cols="12" md="6" class="col-px-0"
                >湿度:{{ dialogInfo.title }}</v-col
              >
              <v-col cols="12" md="6" class="col-px-0"
                >电量:{{ dialogInfo.status }}</v-col
              >
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: "Overiew",
  data() {
    return {
      urlImage: "/media/bg/dimarer_bg.png",
      padding: 20,
      dialogVisible: false,
      dialogInfo: {
        title: "test1",
        status: 1,
        temperature: 38,
        noise: 10,
        humidity: 80,
        electricity: 35,
      },
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
          x: 0.4,
          y: 0.2,
          color: "red",
          title: "test1",
          status: 1,
          temperature: 38,
          noise: 10,
          humidity: 80,
          electricity: 35,
        },
        {
          x: 0.8,
          y: 0.3,
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
          color: "red",
          color: "red",
          title: "test1",
          status: 1,
          temperature: 38,
          noise: 10,
          humidity: 80,
          electricity: 35,
        },
      ],
    };
  },
  watch: {
    dialogVisible(val) {
      val || this.close();
    },
  },
  methods: {
    showMessage: function (info) {
      this.dialogInfo = info;
      this.dialogVisible = true;
      console.log("--info---", info);
    },
    close: function () {
      this.dialogVisible = false;
    },
  },
};
</script>

<style scoped>
.image-marker {
  /* width: 100vh; */
  height: 100vh;
  width: 100%;
  border: solid 1px silver;
  user-select: none;
  background-color: #f8f8f8;
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

.marker-title {
  text-align: center;
  color: #f8f8f8;
}
.dialog-content{background-color: #f8f8f8;}
</style>
