<template>
  <div class="rounded p-4 card no-border v-application" data-app="true">
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
            <th v-for="(header, h) in headers" class="text-white" :key="h">
              {{ $t(header.text) }}
            </th>
          </tr>
        </thead>
      </template>

      <template v-slot:item.name="{ item }">
        <router-link
          :to="{ path: 'strlist', query: { id: item.id } }"
          class="text-white"
          >{{ item.name }}</router-link
        >
      </template>
      <template v-slot:top>
        <v-toolbar flat color="" class="no-bg text-white">
          <!-- 新增按钮 -->
          <v-toolbar-title class="font-size-h3 font-weight-bolder">{{
            $t("COMMON.PRODUCTION")
          }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <!-- 模态框 -->
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn color="primary" dark class="mb-2" v-bind="attrs" v-on="on">{{
                $t("COMMON.NEWLYADDED")
              }}</v-btn>
            </template>

            <v-form
              ref="form"
              v-model="valid"
              lazy-validation
              @submit.stop.prevent="onSubmit"
            >
              <v-card class="card">
                <v-card-title>
                  <h5 class="headline text-white">{{ $t("COMMON.PRODUCTION") }}</h5>
                </v-card-title>
                <v-card-text>
                  <v-container>
                    <v-text-field
                      v-model="editedItem.id"
                      label="Id"
                      v-show="false"
                    ></v-text-field>
                    <div class="text-title">{{ $t("COMMON.pType") }}：</div>
                    <v-select
                      :items="typeitems"
                      itvalueem-value="value"
                      item-text="label"
                      v-model="editedItem.type"
                      class="vselect"
                    ></v-select>
                    <div class="text-title">{{ $t("COMMON.pTime") }}：</div>
                    <date-picker
                      type="datetime"
                      class="datepickers strdate"
                      v-model="editedItem.created_at"
                      locale="zh-cn"
                      format="YYYY-M-D HH:mm:ss"
                      :locale-config="localeConfig"
                      auto-submit
                    ></date-picker>

                    <div class="text-title">{{ $t("COMMON.pName") }}：</div>
                    <v-text-field
                      v-model="editedItem.name"
                      label="Title"
                      :rules="nameRules"
                      required
                    ></v-text-field>
                    <div class="text-title">{{ $t("COMMON.pResult") }}</div>
                    <v-text-field
                      v-model="editedItem.value"
                      label="Title"
                      :rules="valueRules"
                      required
                    ></v-text-field>
                    <div class="text-title">{{ $t("COMMON.pRemark") }}：</div>
                    <v-text-field
                      v-model="editedItem.remark"
                      label="Title"
                      required
                    ></v-text-field>
                  </v-container>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn text @click="close" class="canclebtn">{{
                    $t("COMMON.CANCEL")
                  }}</v-btn>
                  <v-btn class="confbtn" text @click="onSubmit">{{
                    $t("COMMON.SAVE")
                  }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-form>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:item.actions="{ item }">
        <!--                <router-link :to="{ path: 'chart', query: { chart_id: item.id,business_id:item.business_id }}" @click="hitsclick(3,item.name,item.id,item.business_id)"><v-btn color="primary" class="mr-4" small>可视化图表</v-btn></router-link>-->
        <v-btn color="primary" class="mr-4" small @click="editItem(item)">{{
          $t("COMMON.EDIT")
        }}</v-btn>
        <v-btn color="error" class="mr-4" small @click="deleteItem(item)">{{
          $t("COMMON.DELETE")
        }}</v-btn>
      </template>
    </v-data-table>
    <v-pagination
      class="float-right"
      v-model="page"
      :circle="circle"
      :disabled="disabled"
      :length="length"
      :page="page"
      :total-visible="limit"
      @input="pageChange"
    ></v-pagination>
    <div style="clear: both"></div>
  </div>
</template>
<style scoped>
.v-application .text-start {
  text-align: center !important;
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
</style>

<script>
import { LOGIN, LOGOUT } from "@/core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";

import ApiService from "@/core/services/api.service";
import Hits from "@/assets/js/components/com.js";
export default {
  data: () => ({
    hideheader: true,
    seen: true,
    length: 3,
    circle: false,
    disabled: false,
    limit: 15,
    page: 1,
    headers: [
      { text: "COMMON.pType", class: "text-white", value: "type" },
      { text: "COMMON.pName", class: "text-white", value: "name" },
      { text: "COMMON.pResult", class: "text-white", value: "value" },
      { text: "COMMON.pTime", class: "text-white", value: "created_at" },
      { text: "COMMON.pRemark", class: "text-white", value: "remark" },
      { text: "操作", class: "text-white", value: "actions" },
    ],
    desserts: [],
    entity_id: "",
    type: 4,
    equlist: [],
    typelist: [
      { id: 1, name: "今日数据" },
      { id: 2, name: "本周数据" },
      { id: 3, name: "本月数据" },
      { id: 4, name: "自定义" },
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
    editedIndex: -1,
    editedItem: {
      type: "",
      created_at: "",
      name: "",
      value: "",
      remark: "",
    },
    defaultItem: {
      type: "",
      created_at: "",
      name: "",
      value: "",
      remark: "",
    },
    nameRules: [(v) => !!v || "请输入种植名称"],
    valueRules: [(v) => !!v || "请输入产出结果"],
    typeitems: [
      { value: "1", label: "种植" },
      { value: "2", label: "用药" },
      { value: "3", label: "收获" },
    ],
  }),

  created() {
    this.ajaxdata();
  },

  methods: {
    ajaxdata() {
      console.log("chaxun");
      ApiService.post(AUTH.local_url + "/production/index", {
        limit: this.limit,
        page: this.page,
        entity_id: this.entity_id,
        type: this.type,
        start_time: this.start_time,
        end_time: this.end_time,
      }).then(({ data }) => {
        if (data.code == 200) {
          this.desserts = data.data.data;
          this.length = data.data.last_page;
        } else if (data.code == 401) {
          this.$store.dispatch(LOGOUT).then(() => this.$router.push({ name: "login" }));
        } else {
        }
      });
    },
    pageChange() {
      this.ajaxdata();
    },
    //新增或编辑
    onSubmit() {
      if (this.editedIndex > -1) {
        // 编辑
        Object.assign(this.desserts[this.editedIndex], this.editedItem);
        const id = this.editedItem.id;
        var val = this.$refs.form.validate();
        if (val == true) {
          ApiService.post(AUTH.local_url + "/production/edit", {
            id: id, //id
            name: this.editedItem.name, //种植名称
            type: this.editedItem.type, //种植类型
            value: this.editedItem.value, //产出结果
            remark: this.editedItem.remark, //备注
            created_at: this.editedItem.created_at, //时间
          }).then(({ data }) => {
            if (data.code == 200) {
              this.editedItem.title = "";
              this.ajaxdata();
            }
          });
          this.close();
        }
      } else {
        // 新增
        var val = this.$refs.form.validate();
        if (val == true) {
          ApiService.post(AUTH.local_url + "/production/add", {
            name: this.editedItem.name, //种植名称
            type: this.editedItem.type, //种植类型
            value: this.editedItem.value, //产出结果
            remark: this.editedItem.remark, //备注
            created_at: this.editedItem.created_at, //时间
          }).then(({ data }) => {
            if (data.code == 200) {
              this.editedItem.title = "";
              this.ajaxdata();
            }
          });
          this.close();
        }
      }
    },
    //编辑
    editItem(item) {
      console.log("item===", item);
      this.seen = false;
      this.editedIndex = this.desserts.indexOf(item);
      this.dialog = true;
      ApiService.post(AUTH.local_url + "/production/update", {
        id: item.id, //id
      }).then(({ data }) => {
        if (data.code == 200) {
          data.data.type = data.data.type.toString();
          this.editedItem = Object.assign({}, data.data);
          this.editedItem.created_at = data.data.insert_at;
        }
      });
    },
    //删除
    deleteItem(item) {
      this.editedItem = Object.assign({}, item);
      const id = this.editedItem.id;
      var con = confirm(this.$t("COMMON.TITLE4"));
      if (con == true) {
        ApiService.post(AUTH.local_url + "/production/delete", { id: id }).then(
          ({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.ajaxdata();
            }
          }
        );
      }
    },
    //关闭弹框
    close() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
  },
};
</script>
