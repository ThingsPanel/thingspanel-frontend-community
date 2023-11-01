<template>
  <div class="homes rounded">
    <!--begin::Home-->
    <div>
      <ListWidget10></ListWidget10>
    </div>
    <!--最近访问-->
    <div class="card card-custom card-stretch gutter-b mb-4.5" v-show="isshowguide">
      <!--begin::Header-->
      <div class="card-header align-items-center border-0 mt-3 px-6">
        <h3 class="card-title align-items-start flex-column">
          <span class="font-weight-bolder text-dark">
            <!--{{ $t("COMMON.QUICKGUIDE") }}-->
            {{ $t("HOME.LAST_VISIT") }}
          </span>
        </h3>

        <div class="width-100 mb-2">
          <div v-for="(item,index) in guidlist" :key="index"  class="float-left inline-block mr-10 mb-2">
            <!--可视化-->
            <router-link
              v-if="item.type == 4"
              :to="{
                path: 'chart/chart',
                query: {
                  chart_id: item.data.chart_id,
                  business_id: item.data.business_id,
                },
              }"
            >
              <div class="guidbtn">
                <div class="font-des font-weight-bold font-size-sm">
                  {{ $t("HOME.VISUALIZATION") }}->{{ item.name }}
                </div>
              </div>
            </router-link>
            <!--业务编辑资产-->
            <router-link
              v-if="item.type == 1"
              :to="{ path: 'editbusiness', query: { id: item.data.id } }"
            >
              <div class="guidbtn">
                <div class="font-des font-weight-bold font-size-sm">
                  {{ $t("HOME.BUSINESS") }}->{{ item.name }}
                </div>
              </div>
            </router-link>
            <!--告警策略-->
            <router-link
              v-if="item.type == 3"
              :to="{ path: 'strategy/alarmlist', query: { id: item.data.id } }"
            >
              <div class="guidbtn">
                <div class="font-des font-weight-bold font-size-sm">
                  {{ $t("HOME.AUTOMATION") }} -> {{ item.name }}->{{
                    $t("HOME.ALARMSTRATEGY")
                  }}
                </div>
              </div>
            </router-link>
            <!--控制策略-->
            <router-link
              v-if="item.type == 2"
              :to="{ path: 'strategy/strlist', query: { id: item.data.id } }"
            >
              <div class="guidbtn">
                <div class="font-des font-weight-bold font-size-sm">
                  {{ $t("HOME.AUTOMATION") }} -> {{ item.name }}->{{
                    $t("HOME.CONTROLSTRATRGY")
                  }}
                </div>
              </div>
            </router-link>
          </div>
        </div>

      </div>
    </div>
    <div class="card-custom card-stretch gutter-b mb-4.5">
      <!-- <MixedWidget3_A/> -->
      <component :is="middleWidget"/>
    </div>
    <div class="card-custom card-stretch gutter-b mb-4.5" style="margin-top:-22px">
      <!-- 底部卡片 -->
      <component :is="bottomWidget"/>
    </div>

  </div>
</template>
<script>
import MixedWidget3_A from "@/view/content/widgets/mixed/Widget3_A.vue";
import MixedWidget3_B from "@/view/content/widgets/mixed/Widget3_B.vue";
import MixedWidget4_A from "@/view/content/widgets/mixed/Widget4_A.vue";
import MixedWidget4_B from "@/view/content/widgets/mixed/Widget4_B.vue";
import ListWidget10 from "@/view/content/widgets/list/Widget10.vue";

import { REFRESH } from "@/core/services/store/auth.module";
import { local_url } from "@/api/LocalUrl"
import ApiService from "@/core/services/api.service";
import JwtService from "@/core/services/jwt.service";

export default {
  name: "home",
  data: () => ({
    isshowguide: false,
    guidlist: [],
  }),
  components: {
    ListWidget10,
    MixedWidget3_A,
    MixedWidget3_B,
    MixedWidget4_A,
    MixedWidget4_B
  },
  created() {
    this.ajaxdata();
  },
  computed: {
    middleWidget() {
      let userType = this.$store.getters.currentUser.authority || JwtService.getCurrentUser().authority;
      if (userType === "TENANT_ADMIN") {
        return "MixedWidget3_B";
      } else {
        return "MixedWidget3_A";
      }
    },
    bottomWidget() {
      let userType = this.$store.getters.currentUser.authority || JwtService.getCurrentUser().authority;
      if (userType === "TENANT_ADMIN") {
        return "MixedWidget4_B";
      } else {
        return "MixedWidget4_A";
      }
    }
  },
  methods: {
    ajaxdata() {
      ApiService.post(local_url + "api/asset/work_index", {
        work_name: "",
        page: 1,
      }).then(({ data }) => {
        if (data.code == 200) {
          if (data.data.data.length > 0) {
            // this.isshowguide = true;
            this.getguidlist();
          }
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
          //
        }
      });
    },

    getguidlist() {
      ApiService.post(local_url + "api/navigation/list", {
        work_name: "",
      }).then(({ data }) => {
        if (data.code == 200) {
          this.guidlist = data.data;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
          //
        }
      });
    },
  },
};
</script>
<style>
.clear {
  clear: both;
}
 
</style>
<style scoped>
/* #app {
    height: 100%;
    width: 100%;
    padding: 0px;
    margin: 0px;
  } */
.guidbtn {
  /*background: #5B92FF;padding: 15px 15px;*/
  color: #fff;
  border-radius: 4px; /*font-size: 15px;font-weight: bolder;*/
}
.font-des {
  font-size: 12px;
  font-weight: 100;
  color: #a8c5ff;
}
.arrowicon {
  margin-left: 20px;
  color: #2a45c5;
  font-size: 25px;
  position: relative;
  bottom: 3px;
}

</style>

