<template>
  <v-container class="card card-custom">
    <v-row no-gutters>
      <v-col cols="12" md="3">
        <!-- 路径搜索 -->
        <v-text-field
          class="pt-0 mx-2 my-v-input"
          v-model="search_path"
          :label="$t('COMMON.TITLE28')"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <!-- ip搜索 -->
        <v-text-field
          class="pt-0 mx-2 my-v-input"
          v-model="search_ip"
          :label="$t('COMMON.PLACEHOLDER32')"
        ></v-text-field>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="12" md="3">
        <!-- 按钮 -->
        <div class="text-right mt-1">
          <v-btn color="indigo" dark @click="operation()">{{
            $t("COMMON.SEARCH")
          }}</v-btn>
          <v-btn color="white ml-4" @click="reset()">{{
            $t("COMMON.RESET")
          }}</v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col cols="12">
        <!-- 数据表格 -->
        <v-data-table
          :headers="headers"
          :hide-default-header="true"
          :items="list"
          item-key="id"
          class="no-bg text-white"
          hide-default-footer
        >
          <template v-slot:header="{ props: { headers } }">
            <thead>
              <tr>
                <th v-for="(header, h) in headers" class="text-white" :key="h">
                  {{ $t(header.text) }}
                </th>
              </tr>
            </thead>
          </template>
          <template v-slot:[`item.board`]="{ item }">
            {{ $t(item.board) }}
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-btn color="primary" class="mr-4" small @click="clickItem(item)"
              >详情</v-btn
            >
          </template>
        </v-data-table>

        <div v-show="tip" class="text-white">{{ $t("COMMON.TITLE26") }}</div>
        <v-pagination
          v-if="length > 1"
          class="float-right mt-8"
          v-model="page"
          :length="length"
          :page="page"
          :total-visible="10"
          @input="pageChange"
        ></v-pagination>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">

</style>

<script>
import Dropdown2 from "@/view/content/dropdown/Dropdown2.vue";
import { mapGetters } from "vuex";
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
import { REFRESH } from "@/core/services/store/auth.module";
import { dateFormat } from "../../../utils/tool.js";

export default {
  name: "widget-9",
  data() {
    return {
      list: [],
      length: 1,
      circle: false,
      disabled: false,
      limit: 10,
      page: 1,
      search_ip: "",
      search_path: "",
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
      headers: [
        {
          text: "COMMON.NO",
          class: "text-white",
          cellClass: "td-item",
          align: "start",
          sortable: false,
          value: "no",
        },
        {
          text: "IP",
          class: "text-white",
          value: "ip",
        },
        {
          text: "COMMON.PATH",
          class: "text-white",
          value: "path",
        },
        {
          text: "COMMON.INSTRUCTION",
          class: "text-white",
          value: "board",
        },
        {
          text: "COMMON.TIMES",
          class: "text-white",
          value: "time",
        },
        {
          text: "COMMON.CONSUMING",
          class: "text-white",
          value: "time_lang",
        },
        {
          text: "COMMON.USERNAME",
          class: "text-white",
          value: "users",
        },
      ],
    };
  },
  components: {
    Dropdown2,
  },
  created() {
    var data = new Date();
    var month =
      data.getMonth() < 9 ? "0" + (data.getMonth() + 1) : data.getMonth() + 1;
    var date = data.getDate() <= 9 ? "0" + data.getDate() : data.getDate();
    var hour = data.getHours();
    var minute = data.getMinutes();
    var second = data.getSeconds();
    var days = 7;
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
    this.operation();
  },
  methods: {
    operation() {
      let _that = this;
      ApiService.post(AUTH.local_url + "/operation/list", {
        limit: _that.limit,
        page: _that.page,
        ip: _that.search_ip,
        path: _that.search_path,
      }).then(({ data }) => {
        if (data.code == 200) {
          if (data.data.data.length > 0) {
            _that.tip = false;

            var mylist = [];
            for (var i = 0; i < data.data.data.length; i++) {
              var item = data.data.data[i];
              var detailed = JSON.parse(item.detailed);
              var dict = {
                1: "COMMON.LOG1",
                2: "COMMON.LOG2",
                3: "COMMON.LOG3",
                4: "COMMON.LOG4",
                5: "COMMON.LOG5",
                6: "COMMON.LOG6",
                7: "COMMON.LOG7",
                8: "COMMON.LOG8",
                9: "COMMON.LOG9",
                10: "COMMON.LOG10",
                11: "COMMON.LOG11",
              };
              mylist.push({
                no: i + 1,
                ip: detailed.ip,
                path: detailed.path,
                board: item.type != "" ? dict[item.type] : "Unknown",
                time: dateFormat(item.created_at),
                time_lang: detailed.request_time + "ms",
                users: detailed.name ? detailed.name : "未知用户",
              });
            }

            _that.list = mylist;
          } else {
            _that.tip = true;
            _that.list = [];
          }
          _that.length = Math.ceil(data.data.total / data.data.per_page);
          _that.page = data.data.current_page;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      });
    },
    reset() {
      this.search_ip = "";
      this.search_path = "";
      this.operation();
    },
    pageChange() {
      this.operation();
    },
    clickItem(item) {},
  },
  computed: {
    ...mapGetters(["layoutConfig"]),
  },
};
</script>
