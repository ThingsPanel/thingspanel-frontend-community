<template>
  <div class="rounded p-4 card no-border v-application" data-app="true">
    <v-row class="" style="height: 75px">
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
          v-model="entity_id"
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
          ></el-option>
        </el-select>
      </v-col>
      <!-- <v-col cols="12" xs="12" md="2">
        <el-select
          v-model="type"
          :popper-append-to-body="false"
          class="width-100"
        >
          <el-option
            v-for="(t, index) in typelist"
            :key="index"
            :value="t.id"
            :label="t.name"
          ></el-option>
        </el-select>
      </v-col> -->
      <v-col cols="12" xs="12" md="2">
        <date-picker
          type="datetime"
          class="datepickers strdate"
          v-model="start_time"
          locale="zh-cn"
          format="YYYY-M-D HH:mm:ss"
          :locale-config="localeConfig"
          auto-submit
        ></date-picker>
      </v-col>
      <v-col cols="12" xs="12" md="2">
        <date-picker
          type="datetime"
          class="datepickers enddate"
          v-model="end_time"
          locale="zh-cn"
          format="YYYY-M-D HH:mm:ss"
          :locale-config="localeConfig"
          auto-submit
        ></date-picker>
      </v-col>
      <v-col cols="12" xs="12" md="2">
        <el-input
          class="searchInput"
          type="text"
          v-model="token"
          placeholder="请输入Token"
        />
      </v-col>

      <v-col cols="24" xs="24" md="2">
        <v-btn color="primary" @click="exportdata" style="margin-left: 12px"
          >导出</v-btn
        >
        <v-btn color="primary" @click="ajaxdata" style="margin-left: 12px"
          >搜索</v-btn
        >
      </v-col>
      <!--            <v-col cols="12" xs="12" md="1">-->
      <!--                <v-btn color="primary" @click="exportdata">导出</v-btn>-->
      <!--            </v-col>-->
    </v-row>
    <v-data-table
      :headers="headers"
      :hide-default-header="hideheader"
      :items="desserts"
      sort-by="calories"
      class="no-bg text-white"
      hide-default-footer
    >
      <template v-slot:header="{ props: { headers } }">
        <thead>
          <tr>
            <th
              v-for="(header, h) in headers"
              class="text-white"
              :class="h == 3 ? 'text-center width-300' : ''"
              :key="header.id"
            >
              {{ $t(header.text) }}
            </th>
          </tr>
        </thead>
      </template>
      <template v-slot:item.name="{ item }">
        <!-- <router-link
          :to="{ path: 'strlist', query: { id: item.id } }"
          class="text-white"
          >{{ item.name }}
        </router-link> -->
        <div>{{ item.name }}</div>
      </template>
      <template v-slot:item.dbl_v="{ item }">
        <div v-if="item.str_v.indexOf('file') == -1">{{ item.dbl_v }}</div>
        <el-image
          style="width: 100px; height: 80px"
          :src="url + item.str_v"
          :preview-src-list="imgView(item.str_v)"
          v-else
        >
        </el-image>
      </template>
    </v-data-table>
    <v-pagination
      v-if="length > 1"
      class="float-right mt-8"
      v-model="page"
      :length="length"
      :page="page"
      :total-visible="10"
      @input="pageChange"
    ></v-pagination>
    <div style="clear: both"></div>
    <v-dialog v-model="dialogVisible" max-width="500">
      <v-card class="card">
        <v-card-title>
          <h5 class="headline text-white">温馨提示</h5>
        </v-card-title>
        <v-card-text>
          <div class="text-white">
            确定要导出{{ length*limit }}条数据吗？
          </div></v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="canclebtn" text @click="dialogVisible = false"
            >取消</v-btn
          >
          <v-btn class="confbtn" text @click="toExport">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<style scoped>
.v-application .text-start {
  text-align: center !important;
  font-size: 13px;
}

table td {
  vertical-align: middle;
}

.v-application {
  display: block;
}

.v-middle-80 {
  line-height: 80px;
}

.v-pagination .primary {
  background-color: #1867c0 !important;
  border-color: #1867c0 !important;
}

.sel-width {
  width: 150px;
}

/deep/ .vpd-icon-btn {
  margin: 0 !important;
}
</style>

<script>
import { mapState } from "vuex";
import { REGISTER } from "@/core/services/store/auth.module";
import { UPDATE_USER } from "@/core/services/store/auth.module";
import { REFRESH } from "@/core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";
import { dateFormat } from "../../../utils/tool.js";

import ApiService from "@/core/services/api.service";
import Hits from "@/assets/js/components/com.js";
export default {
  data: () => ({
    dialogVisible: false,
    total: 0,
    hideheader: true,
    seen: true,
    length: 3,
    circle: false,
    disabled: false,
    limit: 10,
    page: 1,
    headers: [
      {
        text: "COMMON.BUSINESSNAME",
        class: "text-white",
        value: "bname",
      },
      {
        text: "COMMON.TITLE29",
        class: "text-white",
        value: "name",
      },
      {
        text: "Token",
        class: "text-white",
        value: "token",
      },
      {
        text: "COMMON.TIMES",
        class: "text-white",
        value: "ts",
      },
      {
        text: "COMMON.TITLE30",
        class: "text-white",
        value: "key",
      },
      {
        text: "COMMON.TITLE31",
        class: "text-white",
        value: "dbl_v",
      },
      {
        text: "COMMON.TITLE32",
        class: "text-white",
        value: "entity_type",
      },
    ],
    token: "",
    desserts: [],
    entity_id: "",
    type: 4,
    equlist: [],
    buisnesss: [],
    buisness_id: "",
    typelist: [
      {
        id: 1,
        name: "今日数据",
      },
      {
        id: 2,
        name: "本周数据",
      },
      {
        id: 3,
        name: "本月数据",
      },
      {
        id: 4,
        name: "自定义",
      },
    ],
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
    start_time: "",
    end_time: "",
    url:(process.env.VUE_APP_BASE_URL ||
    document.location.protocol + "//" + document.domain + ":9999/")
  }),

  created() {
    // this.initialize();
    var data = new Date();
    var month =
      data.getMonth() < 9 ? "0" + (data.getMonth() + 1) : data.getMonth() + 1;
    var date = data.getDate() <= 9 ? "0" + data.getDate() : data.getDate();
    console.log(data.getHours());
    var hour = data.getHours() <= 9 ? "0" + data.getHours() : data.getHours();
    var minute =
      data.getMinutes() <= 9 ? "0" + data.getMinutes() : data.getMinutes();
    var second =
      data.getSeconds() <= 9 ? "0" + data.getSeconds() : data.getSeconds();
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
      "-" +
      month +
      "-" +
      date +
      " " +
      hour +
      ":" +
      minute +
      ":" +
      second;
    var startdate =
      newDate.getFullYear() +
      "-" +
      endmonth +
      "-" +
      enddate +
      " " +
      hour +
      ":" +
      minute +
      ":" +
      second;
    this.start_time = startdate;
    this.end_time = enddates;
    console.log(this.start_time);

    this.equdata();
    this.ajaxdata();
  },

  methods: {
    // 改变业务
      changeBuisness(e){
        this.business_id = e
        this.entity_id = ''
        this.equlist = []
        this.ajaxdata();
      },
      changeAsset(){
        this.ajaxdata();
      },
    imgView(str) {
      let arr = [];
      arr.push(this.url + str);
      return arr;
    },
    onClickBuisness(name, id) {
      let _that = this;
      ApiService.post(AUTH.local_url + "/asset/list", {
        business_id: id,
      })
        .then(({ data }) => {
          console.log("资产编辑列表");
          console.log(data);
          if (data.code == 200) {
            var arr = data.data;
            _that.equlist = arr;
            
            console.log('====', _that.equlist)
          } else {
            this.$store.dispatch(REFRESH).then(() => {});
          }
        })
        .catch(({ response }) => {
          console.log(response);
        });
    },
    equdata() {
      let _that = this;
      ApiService.post(AUTH.local_url + "/business/index", {
        page: 1,
      }).then(({ data }) => {
        console.log("业务列表");
        console.log(data);
        if (data.code == 200) {
          _that.buisnesss = data.data.data;
        }
        if (data.code == 401) {
        } else {
        }
      });
      // ApiService.post(AUTH.local_url + "/kv/list").then(({ data }) => {
      //   console.log("设备列表");
      //   console.log(data);
      //   if (data.code == 200) {
      //     this.equlist = data.data;
      //   } else if (data.code == 401) {
      //     this.$store.dispatch(LOGOUT).then(() =>
      //       this.$router.push({
      //         name: "login",
      //       })
      //     );
      //   } else {
      //   }
      // });
    },
    ajaxdata() {
      ApiService.post(AUTH.local_url + "/kv/index", {
        limit: this.limit,
        page: this.page,
        business_id: this.buisness_id,
        asset_id: this.entity_id,
        type: this.type,
        start_time: this.start_time,
        end_time: this.end_time,
        token: this.token,
      }).then(({ data }) => {
        console.log("数据管理列表");
        console.log(data);
        if (data.code == 200) {
          let datas = data.data.data;
          if (datas) {
            for (let i = 0; i < datas.length; i++) {
              let item = datas[i];
              item["ts"] = dateFormat(item["ts"] / 1000000);
            }
            this.desserts = datas;
            this.length = data.data.total;
            this.length = Math.ceil(data.data.total / data.data.per_page);
          } else {
            this.desserts = [];
          }
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      });
    },

    pageChange() {
      this.equdata();
      this.ajaxdata();
    },
    toExport() {
      ApiService.post(AUTH.local_url + "/kv/export", {
        entity_id: this.entity_id,
        type: this.type,
        start_time: this.start_time,
        end_time: this.end_time,
      }).then(({ data }) => {
        if (data.code == 200) {
          this.dialogVisible = false;
          window.open((process.env.VUE_APP_BASE_URL ||
    document.location.protocol + "//" + document.domain +":9999/").slice(0,(process.env.VUE_APP_BASE_URL ||
    document.location.protocol + "//" + document.domain +":9999/").length-6) +"/"+ data.data, "_blank");
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      });
    },
    exportdata() {
      this.dialogVisible = true;
    },
  },
};
</script>
