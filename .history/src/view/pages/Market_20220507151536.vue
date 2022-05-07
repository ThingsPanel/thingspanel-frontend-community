<template>
  <div class="">
    <div class="gutter-b rounded">
      <div>
        <div class="width-20" v-for="item in listarr">
          <b-card
            v-bind:key="item.id"
            :title="item.name"
            :img-src="item.img"
            img-alt="Image"
            img-top
            tag="article"
            class="mb-5 text-center card-box margin-auto marketbox"
          >
            <b-card-text class="text-left text-muted"
              >{{ $t("COMMON.CLASSIFY") }}：{{ item.type }}</b-card-text
            >
            <b-card-text class="text-left text-muted"
              >{{ $t("COMMON.VERSION") }}：{{ item.version }}</b-card-text
            >
            <!-- <b-card-text class="text-left text-muted"
                >{{ $t("COMMON.AUTHOR") }}：{{ item.author }}</b-card-text
              > -->
            <b-card-text class="text-left text-muted"
              >{{ $t("COMMON.SCORE") }}：<v-rating
                v-model="rating"
                color="orange"
                dense
                small
                class="d-inline-block v-application"
              ></v-rating
            ></b-card-text>
            <b-card-text
              ><b-btn variant="primary" size="sm" class="text-center">{{
                $t("COMMON.INSTALLED")
              }}</b-btn></b-card-text
            >
          </b-card>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.v-pagination .primary {
  background-color: #1867c0 !important;
  border-color: #1867c0 !important;
}
.width-20 {
  width: 20%;
  display: inline-block;
  padding: 10px;
}
.marketbox {
  border-radius: 8px;
}
@media (max-width: 768px) {
  .marketbox {
    max-width: unset !important;
  }
  .width-20 {
    width: 50%;
    display: inline-block;
    padding: 10px;
  }
}
@media (max-width: 500px) {
  .width-20 {
    width: 100%;
    display: block;
    padding: 0px;
  }
}
</style>
<script>
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
import { REFRESH } from "@/core/services/store/auth.module";
export default {
  data() {
    return {
      rating: 5,
      page: 1,
      listarr: [],
      imgarr: [
        "media/logos/wsd.png",
        "media/logos/gps.png",
        "media/logos/switch.png",
        "media/logos/temperature.png",
        "media/logos/en.png",
        "media/logos/qxz.png",
        "media/logos/qxz.png",
        "media/logos/yy.png",
        "media/logos/switch.png",
      ],
    };
  },
  created() {
    this.ajaxdata();
  },
  methods: {
    ajaxdata() {
      ApiService.post(AUTH.local_url + "/markets/list").then(({ data }) => {
        console.log(data);
        if (data.code == 200) {
          for (var i = 0; i < data.data.length; i++) {
            data.data[i]["img"] = this.imgarr[i];
            if (data.data[i]["template"] == "live") {
              // 监控插件
              data.data[i]["img"] = "media/logos/jk.png";
            } else if (data.data[i]["template"] == "environment") {
              // 环境插件
              data.data[i]["img"] = "media/logos/en.png";
            } else if (data.data[i]["template"] == "gps_track") {
              // gps插件
              data.data[i]["img"] = "media/logos/gps.png";
            } else if (data.data[i]["template"] == "x_switch") {
              // 开关插件
              data.data[i]["img"] = "media/logos/switch.png";
            } else if (data.data[i]["template"] == "x_time") {
              // 温湿度插件
              data.data[i]["img"] = "media/logos/temperature.png";
            } else if (
              data.data[i]["template"] == "EnvironmentPanel:environment"
            ) {
              // 水肥插件
              data.data[i]["img"] = "media/logos/wsd.png";
            } else if (data.data[i]["template"] == "weather_week") {
              // 气象插件
              data.data[i]["img"] = "media/logos/qxz.png";
            } else if (
              data.data[i]["template"] == "EnvironmentPanel:environment"
            ) {
              // 渔场插件
              data.data[i]["img"] = "media/logos/yy.png";
            } else if (data.data[i]["template"] == "screen") {
              // 渔场可视化
              data.data[i]["img"] = "media/logos/yy.png";
            }
          }
          this.listarr = data.data;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      });
    },
  },
};
</script>
