<template>
  <!--begin::List Widget 4-->
  <div class="card card-custom card-stretch gutter-b v-application">
    <!--begin::Header-->
    <div class="card-header border-0">
      <h3 class="card-title font-weight-bolder text-dark">
        {{ $t("COMMON.WARNINFO") }}
      </h3>
      <div class="datebox float-right mt-4">
        <div class="wid-16 float-left">
          <date-picker
            type="datetime"
            class="datepickers strdate"
            v-model="start_date"
            locale="zh-cn"
            format="YYYY/M/D HH:mm:ss"
            :locale-config="localeConfig"
            auto-submit
          ></date-picker>
        </div>
        <div class="wid-16 float-left mx-6">
          <date-picker
            type="datetime"
            class="datepickers enddate"
            v-model="end_date"
            locale="zh-cn"
            format="YYYY/M/D HH:mm:ss"
            :locale-config="localeConfig"
            auto-submit
          ></date-picker>
        </div>
        <div class="float-left" style="padding-left: 50px">
          <v-btn color="primary" @click="warning()">{{
            $t("COMMON.SEARCH")
          }}</v-btn>
        </div>
      </div>
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
        class="float-right"
        v-model="page"
        :circle="circle"
        :disabled="disabled"
        :length="length"
        :page="page"
        :total-visible="limit"
        @input="pageChange"
		style="margin-top: 30px;"
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
  },
  methods: {
    warning() {
      let _that = this;
      ApiService.post(AUTH.local_url + "/warning/list", {
        limit: this.limit,
        page: this.page,
        start_date: this.start_date,
        end_date: this.end_date,
      }).then(({ data }) => {
        if (data.code == 200) {
          if (data.data.data.length > 0) {
            _that.tip = false;
            _that.list = data.data.data;
            let datas = data.data.data;
            for (let i = 0; i < datas.length; i++) {
              let item = datas[i];
              item["created_at"] = dateFormat(item["created_at"]);
            }
          } else {
            _that.tip = true;
          }
          _that.length = parseInt(data.data.total / data.data.per_page) ;
          _that.page = data.data.current_page;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      });
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
