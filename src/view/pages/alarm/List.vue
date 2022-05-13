<template>
  <!--begin::List Widget 4-->
  <div class="card card-custom card-stretch gutter-b v-application">
    <!--begin::Header-->
    <div class="card-header border-0">
      <!-- <h3 class="card-title font-weight-bolder text-dark">
        {{ $t("COMMON.WARNINFO") }}
      </h3> -->
	  <v-col cols="12" xs="12" md="2">
	    <el-select
	      v-model="buisness_id"
	      :popper-append-to-body="false"
	      class="width-100"
	      :placeholder="$t('COMMON.PLACEHOLDER8')"
	      @change="changeBuisness"
	      clearable
	    >
	      <el-option
	        v-for="(e, index) in buisnesss"
	        :key="e.ts"
	        :value="e.id"
	        :label="e.name"
	        @click.native="onClickBuisness(e.name, e.id)"
	      ></el-option>
	    </el-select>
	  </v-col>
	  <v-col cols="12" xs="12" md="2">
	    <el-select
	      v-model="asset_id"
	      :popper-append-to-body="false"
	      class="width-100"
	      :placeholder="$t('COMMON.PLACEHOLDER35')"
	      @change="changeAsset"
	      clearable
		  
	    >
	      <el-option
	        v-for="(e, index) in equlist"
	        :key="e.latesttime"
	        :value="e.id"
	        :label="e.name"
			@click.native="onClickAsset(e.device)"
	      ></el-option>
	    </el-select>
	  </v-col>
	  <v-col cols="12" xs="12" md="2">
	  <el-select
	    v-model="device_id"
	    :popper-append-to-body="false"
	    class="width-100 vselect"
		:placeholder="$t('COMMON.PLACEHOLDER3')"
		@change="changeDevice"
		clearable
	  >
	    <el-option
	      v-for="(t, index) in devicearr"
	      :key="index"
	      :value="t.id"
	      :label="t.name"
	    ></el-option>
	  </el-select>
	  </v-col>
	  <v-col cols="12" xs="12" md="2">
		  <date-picker
		    type="datetime"
		    class="datepickers strdate"
		    v-model="start_date"
		    locale="zh-cn"
		    format="YYYY/M/D HH:mm:ss"
		    :locale-config="localeConfig"
		    auto-submit
		  ></date-picker>
	   </v-col>
	   <v-col cols="12" xs="12" md="2">
		   <date-picker
		     type="datetime"
		     class="datepickers enddate"
		     v-model="end_date"
		     locale="zh-cn"
		     format="YYYY/M/D HH:mm:ss"
		     :locale-config="localeConfig"
		     auto-submit
		   ></date-picker>
	    </v-col>
		<v-col cols="12" xs="12" md="1">
		  <v-btn color="primary" @click="warning()">{{
		    $t("COMMON.SEARCH")
		  }}</v-btn>
		</v-col>
    </div>
    <!--end::Header-->
    <!--begin::Body-->
    <div class="card-body">
      <template v-for="(item, i) in list">
        <!--begin::Item-->
        <div class="d-flex align-items-center" v-bind:key="i">
          <!--begin::Symbol-->
          <span class="symbol-label mt-1">
            <inline-svg
              src="media/svg/icons/General/Shield-disabled.svg"
              class="h-100 align-self-end"
            ></inline-svg>
          </span>
          <!--end::Symbol-->
          <!--begin::Text-->
          <div class="d-flex flex-column flex-grow-1 ml-4">
            <a
              href="#"
              class="text-dark text-hover-primary font-size-lg pos-re-12"
            >
              {{ item.describe }}
            </a>
            <span class="text-muted text-right font-weight-bolder">
              {{ item.created_at }}
            </span>
          </div>
          <!--end::Text-->
        </div>
        <!--end::Item-->
      </template>
      <div v-show="tip" class="text-white">{{ $t("COMMON.TITLE26") }}</div>
      <v-pagination
        v-if="length > 1"
        class="float-right"
        v-model="page"
        :length="length"
        :page="page"
        :total-visible="10"
        @input="pageChange"
        style="margin-top: 30px"
      ></v-pagination>
    </div>
    <!--end::Body-->
  </div>
  <!--end: List Widget 4-->
</template>
<style scoped>
.max-height {
  max-height: 260px;
  overflow-y: auto;
  margin-bottom: 20px;
}
.pos-re-12 {
  position: relative;
  top: 12px;
}

/deep/ .datepickers input {
  color: red !important;
}
</style>
<script>
import Dropdown2 from "@/view/content/dropdown/Dropdown2.vue";
import Dropdown4 from "@/view/content/dropdown/Dropdown4.vue";
import { mapGetters } from "vuex";
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
import { REFRESH } from "@/core/services/store/auth.module";
import { dateFormat } from "../../../utils/tool.js";
export default {
  name: "widget-3",
  data() {
    return {
      list: [],
      length: 1,
      circle: false,
      disabled: false,
      limit: 10,
      page: 1,
      localeConfig: {
        "zh-cn": {
          dow: 0,
          dir: "ltr",
          lang: {
            label: "ZH-CN",
            submit: "确定",
            cancel: "取消",
            now: "现在",
          },
        },
      },
      start_date: "",
      end_date: "",
      tip: false,
      equlist: [],
      asset_id:'',
      buisnesss: [],
      buisness_id: "",
      devicearr:[],
      device_id:'',
    };
  },
  components: {
    Dropdown2,
    Dropdown4,
  },
  created() {
    var data = new Date();
    var month =
      data.getMonth() < 9 ? "0" + (data.getMonth() + 1) : data.getMonth() + 1;
    var date = data.getDate() <= 9 ? "0" + data.getDate() : data.getDate();
    var hour = data.getHours();
    var minute = data.getMinutes();
    var second = data.getSeconds();
    var days = 30;
    var newDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    var endmonth =
      newDate.getMonth() < 9
        ? "0" + (newDate.getMonth() + 1)
        : newDate.getMonth() + 1;
    var enddate =
      newDate.getDate() <= 9 ? "0" + newDate.getDate() : newDate.getDate();
    var enddates =
      data.getFullYear() +
      "/" +
      month +
      "/" +
      date +
      " " +
      hour +
      ":" +
      minute +
      ":" +
      second;
    var startdate =
      newDate.getFullYear() +
      "/" +
      endmonth +
      "/" +
      enddate +
      " " +
      hour +
      ":" +
      minute +
      ":" +
      second;
    this.start_date = startdate;
    this.end_date = enddates;
  },
  mounted() {
    this.warning();
    this.equdata();
  },
  methods: {
      warning() {
        let _that = this;
        ApiService.post(AUTH.local_url + "/warning/log/list", {
          limit: this.limit,
          page: this.page,
          business_id:_that.buisness_id,
          device_id:_that.device_id,
          asset_id:_that.asset_id,
          start_date: this.start_date,
          end_date: this.end_date,
        }).then(({ data }) => {
          if (data.code == 200) {
        let datas = data.data.data;
            if (datas) {
              _that.tip = false;
              _that.list = data.data.data;
              let datas = data.data.data;
              for (let i = 0; i < datas.length; i++) {
                let item = datas[i];
                item["created_at"] = dateFormat(item["created_at"]);
              }
            } else {
              _that.list = [];
              _that.tip = true;

            }
            _that.length = parseInt(data.data.total / data.data.per_page);
            _that.page = data.data.current_page;
          } else if (data.code == 401) {
            this.$store.dispatch(REFRESH).then(() => {});
          } else {
          }
        });
      },
    equdata() {
      let _that = this;
      ApiService.post(AUTH.local_url + "/business/index", {
        page: 1,
      }).then(({ data }) => {
        console.log("业务列表");
        console.log(222,data);
        if (data.code == 200) {
          _that.buisnesss = data.data.data;
        }
        if (data.code == 401) {
        } else {
        }
      });
    },
    // 改变业务
	  changeBuisness(e){
	    this.business_id = e
		this.equlist=[],
		this.asset_id='',
		this.devicearr=[],
		this.device_id='',
	    this.warning();
	  },
	  changeAsset(e){
		  this.asset_id=e,
		  this.devicearr=[],
		  this.device_id='',
	    this.warning();
	  },
	  changeDevice(){
		 this.warning(); 
	  },
    onClickBuisness(name, id) {
      let _that = this;
      ApiService.post(AUTH.local_url + "/asset/list", {
        business_id: id,
      })
        .then(({ data }) => {
          console.log("资产编辑列表");
          console.log(111111111,data);
          if (data.code == 200) {
            var arr = data.data;
            _that.equlist = arr;
          } else {
            this.$store.dispatch(REFRESH).then(() => {});
          }
        })
        .catch(({ response }) => {
          console.log(response);
        });

    },
    onClickAsset(device){
        this.devicearr = device;
    },
    pageChange() {
      this.warning();
    },
  },
  computed: {
    ...mapGetters(["layoutConfig"]),
  },
};
</script>
