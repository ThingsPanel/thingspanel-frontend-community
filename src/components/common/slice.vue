<template>
  <div
    ref="container"
    class="slice-wrapper"
    @mouseover="componentEnter"
    @mouseleave="componentLeave"
  >
    <header
      ref="header"
      class="card-header"
      :class="{ center: item.chart_type === 'x_number' }"
    >
      <span class="card-title" v-if="item.chart_type !== 'x_number'">{{
        item.title
      }}</span>
      <div class="right-buttons" v-show="isshowBtns">
        <i
          class="ml-2 fa flaticon-delete text-success pointer"
          @click="delpanel(item.id)"
        ></i>
        <i
          class="ml-2 fa fa-cog text-success pointer"
          @click="setupCon(item.id, item.title)"
        ></i>
        <LegendBtn
          class="x-btn"
          v-if="canLegendType.indexOf(item.chart_type) !== -1"
          :legend.sync="legend"
        />
        <SyncBtn
          class="x-btn"
          @sync="getData"
          :white="item.chart_type === 'x_number'"
        />
        <ExpandBtn
          class="x-btn"
          @expand="handleFocus"
          :expand-target="item.i"
          :white="item.chart_type === 'x_number'"
        />
      </div>
    </header>

    <component
      :loading="loading"
      :is="item.chart_type"
      :id="item.slice_id"
      :legend="legend"
      :api-data="apiData"
      :title="item.title"
      :fields="item.fields"
      :colorStart="colorStart"
      :colorEnd="colorEnd"
      @init="chartInit"
      @send="sendMessage"
    />
    <v-dialog v-model="dialog" max-width="500px" append-to-body="true">
      <v-form
        ref="form"
        v-model="valid"
        lazy-validation
        @submit.stop.prevent="onSubmit"
      >
        <v-card class="card">
          <v-card-title>
            <span class="headline text-white">{{ dialogtitle }}</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-text-field label="Id" v-show="false"></v-text-field>
                <v-col cols="4" class="v-middle-80 text-white">
                  {{ $t("COMMON.TEXT2") }}：
                </v-col>
                <v-col cols="8">
                  <v-text-field
                    v-model="interval"
                    label="interval"
                    type="number"
                    min="0"
                  >
                  </v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn class="canclebtn" text @click="close">{{
              $t("COMMON.CANCEL")
            }}</v-btn>
            <v-btn class="confbtn" text @click="onSubmit">{{
              $t("COMMON.SAVE")
            }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
  </div>
</template>
<script>
import ExpandBtn from "@/components/common/expand-btn";
import LegendBtn from "@/components/common/legend-btn";
import SyncBtn from "@/components/common/sync-btn";

import AUTH from "@/core/services/store/auth.module";
import ApiService from "@/core/services/api.service";

import websocket from "../../utils/websocket";

//load charts from system and extensions
const path = require("path");
const files = require.context("@/components/charts", false, /\.vue$/);
const modules = {};
files.keys().forEach((key) => {
  const name = path.basename(key, ".vue");
  modules[name] = files(key).default || files(key);
});

export default {
  name: "Slice",
  props: {
    item: {
      type: Object,
      default() {
        return {};
      },
    },
    colorStart: {
      type: String,
      default: "#7956EC",
    },
    colorEnd: {
      type: String,
      default: "#3CECCF",
    },
    socketData: {
      type: String,
      default: "",
    },
    busid: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      valid: true,
      loading: true,
      chart: null,
      chartData: {},
      legend: true, // whether show legend
      apiData: {},
      canLegendType: [],
      dialog: false,
      interval: "1",
      dialogtitle: "",
      dialogid: "",
      isshowBtns: false,
    };
  },
  components: {
    ExpandBtn,
    LegendBtn,
    SyncBtn,
    ...modules,
  },
  watch: {
    socketData: {
      immediate: true,
      handler(val, oldVal) {
        this.handleWebsocketData();
      },
    },
    item: {
      immediate: true,
      handler(val, oldVal) {
        this.item = val;
        if (oldVal != undefined) {
          this.getData();
        }
      },
    },
  },
  methods: {
    componentEnter() {
      this.isshowBtns = true;
    },
    componentLeave() {
      this.isshowBtns = false;
    },
    async getData() {
      this.loading = true;
      try {
        console.log("Reset initial");
        this.interval = Math.ceil(this.item.interval / 1000);
        this.sendMessage("initial data");
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },

    /**
     * handle focus click
     */
    handleFocus(payload) {
      console.log(payload);
      this.$emit("expand", payload);
    },

    /**
     * chart initialed
     */
    chartInit({ chart, chartData }) {
      this.chart = chart;
      this.chartData = chartData;
    },

    handleWebsocketData() {
      console.log("handleWebsocketData");

      try {
        let socketData = JSON.parse(this.socketData);
        if (socketData.wid && socketData.wid == this.item.id) {
          this.apiData = JSON.parse(socketData.data)[0];
          this.apiData["busid"] = this.busid;
        }
      } catch (e) {
        //not support string
      }
    },

    // send message to server
    sendMessage(message) {
      let data = {
        aid: this.item.aid,
        bid: this.item.bid,
        wid: this.item.id,
        startTs: this.item.startTs,
        interval: this.item.interval !== undefined ? this.item.interval : 1000, // default 1 second
        endTs: this.item.endTs,
        // "config": {
        //   "startTs": this.item.startTs,
        //   "endTs": this.item.endTs,
        //   "latestTime": this.item.latestTime,
        //   "operator": this.item.operator !== undefined ? this.item.operator : "AVG",
        //   "interval": this.item.interval !== undefined ? this.item.interval : 1000 // default 1 second
        // },
        message: message,
      };
      if (data.startTs != NaN && data.startTs != undefined) {
        websocket.send(data);
      }
    },

    // set click event
    setupCon(id, name) {
      console.log("click event");
      console.log(id);
      this.dialogtitle = name;
      this.dialogid = id;
      this.dialog = true;
    },
    close() {
      this.dialog = false;
    },
    onSubmit() {
      this.dialog = false;
      this.item.interval = this.interval * 1000;
      this.sendMessage("set interval");
    },

    // 删除图表
    delpanel(id) {
      var con = confirm("Are you confirm delete？");
      if (con == true) {
        ApiService.post(AUTH.local_url + "/dashboard/delete", {
          id: id,
        }).then(({ data }) => {
          console.log("delete chart");
          console.log(data);
          if (data.code == 200) {
            window.location.reload(); //刷新当前页面
          }
        });
      }
    },
  },
  mounted() {
    this.getData();
  },
};
</script>
<style lang="scss" scoped>
.slice-wrapper {
  width: 100%;
  height: 100%;
}

.card-header {
  background: unset;
  border: unset;
  font-size: 16px;
  color: #fff;
  height: 30px;
  line-height: 30px;
  text-align: left;
  position: relative;
  padding: 0 5px;

  &.center {
    text-align: center;
  }

  .right-buttons {
    height: 30px;
    float: right;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    text-align: right;

    .x-btn {
      width: 20px;
    }
  }

  div {
    color: #fff;
  }
}
</style>
