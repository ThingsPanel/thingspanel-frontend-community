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
          <div v-for="(item,index) in guidlist"  class="float-left inline-block mr-10 mb-2">
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
        <!--<div v-for="item in guidlist" class="float-left inline-block mr-10 mb-5">
            &lt;!&ndash;可视化&ndash;&gt;
            <router-link v-if="item.type==4" :to="{ path: 'chart/chart', query: { chart_id: item.data.chart_id,business_id:item.data.business_id }}">
              <div class="guidbtn">
                <div>{{item.name}}<i class="fa fa-caret-right float-right arrowicon"></i></div>
                <div class="font-des">{{ $t("COMMON.VISUALIZATION") }}</div>
              </div>
            </router-link>
            &lt;!&ndash;业务编辑资产&ndash;&gt;
            <router-link v-if="item.type==1" :to="{ path: 'editbusiness', query: { id: item.data.id }}">
              <div class="guidbtn">
                <div>{{item.name}}<i class="fa fa-caret-right float-right arrowicon"></i></div>
                <div class="font-des">{{ $t("COMMON.BUSINESS") }}</div>
              </div>
            </router-link>
            &lt;!&ndash;告警策略&ndash;&gt;
            <router-link v-if="item.type==3" :to="{ path: 'strategy/alarmlist', query: { id: item.data.id }}">
              <div class="guidbtn">
                <div>{{ $t("COMMON.ALARMSTRATEGY") }}<i class="fa fa-caret-right float-right arrowicon"></i></div>
                <div class="font-des">{{ $t("COMMON.AUTOMATION") }} -> {{item.name}}</div>
              </div>
            </router-link>
            &lt;!&ndash;控制策略&ndash;&gt;
            <router-link v-if="item.type==2" :to="{ path: 'strategy/strlist', query: { id: item.data.id }}">
              <div class="guidbtn">
                <div>{{ $t("COMMON.CONTROLSTRATRGY") }}<i class="fa fa-caret-right float-right arrowicon"></i></div>
                <div class="font-des">{{ $t("COMMON.AUTOMATION") }} -> {{item.name}}</div>
              </div>
            </router-link>
          </div>
        </div>-->
      </div>
    </div>
    <div class="card-custom card-stretch gutter-b mb-4.5">
      <MixedWidget3></MixedWidget3>
    </div>
    <div class="card-custom card-stretch gutter-b mb-4.5" style="margin-top:-22px">
      <MixedWidget4></MixedWidget4>
    </div>
    <!--运行状态-->
    <!--<div>
      <MixedWidget2></MixedWidget2>
    </div>-->
    <!--<div class="row">
      <div class="col-md-6">
      &lt;!&ndash;告警信息&ndash;&gt;
        <ListWidget3></ListWidget3>
      </div>
      <div class="col-md-6">
      &lt;!&ndash;操作日志&ndash;&gt;
        <ListWidget9></ListWidget9>
      </div>
      <div class="clear"></div>
    </div>-->
    <!--end::Home-->
  </div>
</template>
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
<script>
import MixedWidget3 from "@/view/content/widgets/mixed/Widget3.vue";
import MixedWidget4 from "@/view/content/widgets/mixed/Widget4.vue";
import ListWidget10 from "@/view/content/widgets/list/Widget10.vue";

import { REFRESH } from "@/core/services/store/auth.module";
import { local_url } from "@/api/LocalUrl"
import ApiService from "@/core/services/api.service";
import axios from "axios"

export default {
  name: "home",
  data: () => ({
    isshowguide: false,
    guidlist: [],
  }),
  components: {
    ListWidget10,
    MixedWidget3,
    MixedWidget4,
  },
  created() {
    this.ajaxdata();

    // axios.get('http://localhost:3001/test')
    //   .then(res => {
    //     console.log("localhost:3001", res)
    //   })
    
  },
  methods: {
    ajaxdata() {
      ApiService.post(local_url + "api/asset/work_index", {
        work_name: "",
        page: 1,
      }).then(({ data }) => {
        if (data.code == 200) {
          if (data.data.data.length > 0) {
            this.isshowguide = true;
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
        console.log("指南列表");
        console.log(data);
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
