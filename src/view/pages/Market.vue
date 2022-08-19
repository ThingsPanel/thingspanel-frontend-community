<template>
  <div class="">
    <div class="gutter-b rounded">
      <div>
        <div class="width-20" v-for="item in listArr">
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
            <b-card-text class="text-left text-muted text-overflow">
              {{ $t("COMMON.AUTHOR") }}：<span v-b-tooltip :title="item.author">{{ item.author }}</span>
            </b-card-text>
            <b-card-text class="text-left text-muted"
              >{{ $t("COMMON.SCORE") }}：<v-rating
                v-model="rating"
                color="orange"
                dense
                small
                readonly
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
@media (max-width: 1300px) {
  .width-20 {
    width: 25%;
  }
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
.text-overflow {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
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
      listArr: []
    };
  },
  created() {
    this.ajaxdata();
  },
  methods: {
    ajaxdata() {
      ApiService.post(AUTH.local_url + "/markets/list").then(({ data }) => {
        if (data.code == 200) {
          this.listArr = data.data;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      });
    },
  },
};
</script>
