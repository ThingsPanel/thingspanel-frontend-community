<template>
  <div class="rounded p-4 card no-border v-application my-v-input" data-app="true">
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
              :key="h"
            >
              {{ $t(header.text) }}
            </th>
          </tr>
        </thead>
      </template>
      <template v-slot:item.title="{ item }">
        <router-link
          :to="{
            path: 'chart',
            query: { chart_id: item.id, business_id: item.business_id },
          }"
          class="text-white"
          >{{ item.title }}</router-link
        >
      </template>
      <template v-slot:top>
        <v-toolbar flat color="" class="no-bg text-white">
          <!-- 新增用户按钮 -->
          <v-toolbar-title class="font-size-h3 font-weight-bolder">{{
            $t("COMMON.VISUALIZATION")
          }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <!-- 模态框 -->
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="primary"
                dark
                class="mb-2"
                v-bind="attrs"
                v-on="on"
                >{{ $t("COMMON.NEWLYADDED") }}</v-btn
              >
            </template>

            <v-form
              ref="form"
              v-model="valid"
              lazy-validation
              @submit.stop.prevent="onSubmit"
            >
              <v-card class="card">
                <v-card-title>
                  <h5 class="headline text-white">
                    {{ $t("COMMON.ADDVISUALIZATION") }}
                  </h5>
                </v-card-title>
                <v-card-text>
                  <v-container>
                    <v-text-field
                      v-model="editedItem.id"
                      label="Id"
                      v-show="false"
                    ></v-text-field>
                    <div class="text-title">{{ $t("COMMON.NAMES") }}：</div>
                    <v-text-field
                        class="v-label-display-none"
                      v-model="editedItem.title"
                      label="Title"
                      :rules="nameRules"
                      required
                    ></v-text-field>
                    <div class="text-title">{{ $t("COMMON.BUSINESS") }}：</div>
                    <!--                   <v-select
                      :items="busitems"
                      item-value="id"
                      item-text="name"
                      v-model="editedItem.business_id"
                      class="vselect"
                    ></v-select> -->
                    <el-select
                      v-model="editedItem.business_id"
                      class="width-100 vselect"
                    >
                      <el-option
                        v-for="(t, index) in busitems"
                        :key="index"
                        :value="t.id"
                        :label="t.name"
                      ></el-option>
                    </el-select>
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
        <div style="display: flex; flex-direction: row">
          <v-btn
            color="primary"
            class="mr-4"
            small
            @click="hitsclick(4, item.title, item.id, item.business_id)"
            >{{ $t("COMMON.VISUALIZATIONCHART") }}</v-btn
          >
          <v-btn color="primary" class="mr-4" small @click="editItem(item)">{{
            $t("COMMON.EDIT")
          }}</v-btn>
          <v-btn color="error" class="mr-4" small @click="deleteItem(item)">{{
            $t("COMMON.DELETE")
          }}</v-btn>
        </div>
      </template>
    </v-data-table>
    <v-pagination
      v-if="length > 1"
      class="float-right"
      v-model="page"
      :length="length"
      :page="page"
      :total-visible="10"
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
</style>

<script>
import { mapState } from "vuex";
import { REGISTER } from "@/core/services/store/auth.module";
import { UPDATE_USER } from "@/core/services/store/auth.module";
import { REFRESH } from "@/core/services/store/auth.module";
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
    nextIcon: "navigate_next",
    nextIcons: ["mdi-chevron-right", "mdi-arrow-right", "mdi-menu-right"],
    prevIcon: "navigate_before",
    prevIcons: ["mdi-chevron-left", "mdi-arrow-left", "mdi-menu-left"],
    limit: 10,
    page: 1,
    valid: true,
    dialog: false,
    passdialog: false,
    headers: [
      {
        text: "COMMON.NO",
        class: "text-white",
        align: "start",
        sortable: false,
        value: "no",
      },
      { text: "COMMON.TITLE", class: "text-white", value: "title" },
      { text: "COMMON.BUSINESS", class: "text-white", value: "business_name" },
      {
        text: "COMMON.OPERATION",
        class: "text-white",
        align: "right",
        value: "actions",
        sortable: false,
        width: "100%",
      },
    ],
    desserts: [],
    editedIndex: -1,
    editedItem: {
      name: "",
      calories: 0,
      fat: 0,
      carbs: 0,
      protein: 0,
    },
    defaultItem: {
      name: "",
      calories: 0,
      fat: 0,
      carbs: 0,
      protein: 0,
    },
    nameRules: [(v) => !!v || "请输入业务名称"],
    busitems: [{ id: "", name: "无" }],
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "添加用户" : "编辑用户";
    },
    ...mapState({
      errors: (state) => state.auth.errors,
    }),
  },

  watch: {
    dialog(val) {
      val || this.close();
    },
    passdialog(val) {
      val || this.close();
    },
  },

  created() {
    // this.initialize();
    this.ajaxdata();
  },

  methods: {
    /*initialize () {
              this.desserts = [{no:1,name:"东升大厦",datetime:'2020-02-12'},{no:2,name:"东升大厦",datetime:'2020-02-12'}];
            },*/

    ajaxdata() {
      ApiService.post(AUTH.local_url + "/dashboard/index", {
        page: this.page,
        limit: this.limit,
      }).then(({ data }) => {
        console.log("列表");
        console.log(data);

        this.length = Math.ceil(data.data.total / data.data.per_page);
        this.page = data.data.current_page;

        var chartarr = data.data.data;
        if (data.code == 200) {
          ApiService.post(AUTH.local_url + "/dashboard/business").then(
            ({ data }) => {
              if (data.code == 200) {
                // this.busitems = data.data;
                for (let i = 0; i < data.data.length; i++) {
                  this.busitems.push(data.data[i]);
                }

                var arr = [];
                for (var i = 0; i < chartarr.length; i++) {
                  var obg = {};
                  obg.no = i + 1;
                  obg.id = chartarr[i]["id"];
                  obg.title = chartarr[i]["title"];
                  obg.business_id = chartarr[i]["business_id"];
                  for (var j = 0; j < this.busitems.length; j++) {
                    if (this.busitems[j]["id"] == obg.business_id) {
                      obg.business_name = this.busitems[j]["name"];
                    }
                  }
                  arr.push(obg);
                }

                this.desserts = arr;
              } else if (data.code == 401) {
                this.$store.dispatch(REFRESH).then(() => {});
              } else {
              }
            }
          );
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      });
    },

    getbusiness() {
      ApiService.post(AUTH.local_url + "/dashboard/business").then(
        ({ data }) => {
          if (data.code == 200) {
            this.busitems = data.data;
          } else if (data.code == 401) {
            console.log("跳转登录页面");
            this.$store.dispatch(REFRESH).then(() => {});
          } else {
          }
        }
      );
    },

    editItem(item) {
      this.seen = false;
      this.editedIndex = this.desserts.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
    },

    deleteItem(item) {
      this.editedItem = Object.assign({}, item);
      const id = this.editedItem.id;
      var con = confirm(this.$t("COMMON.TITLE4"));
      if (con == true) {
        ApiService.post(AUTH.local_url + "/dashboard/paneldelete", {
          id: id,
        }).then(({ data }) => {
          console.log(data);
          if (data.code == 200) {
            this.ajaxdata();
          }
        });
      }
    },

    close() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },

    pageChange() {
      this.ajaxdata();
    },

    onSubmit() {
      if (this.editedIndex > -1) {
        // 编辑
        Object.assign(this.desserts[this.editedIndex], this.editedItem);
        const id = this.editedItem.id;
        const title = this.editedItem.title;
        const business_id = this.editedItem.business_id;
        console.log(id);
        var val = this.$refs.form.validate();
        if (val == true) {
          ApiService.post(AUTH.local_url + "/dashboard/paneledit", {
            id: id,
            title: title,
            business_id: business_id,
          }).then(({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.editedItem.title = "";
              this.ajaxdata();
            }
          });
          this.close();
        }
      } else {
        // 新增
        const title = this.editedItem.title;
        const business_id = this.editedItem.business_id;
        var val = this.$refs.form.validate();
        if (val == true) {
          ApiService.post(AUTH.local_url + "/dashboard/paneladd", {
            title: title,
            business_id: business_id,
          }).then(({ data }) => {
            if (data.code == 200) {
              this.editedItem.title = "";
              this.ajaxdata();
            } else {
              this.$message({
                showClose: true,
                message: data.message,
                type: "warning",
              });
            }
          });
          this.close();
          // this.desserts.push(this.editedItem)
        }
      }
    },

    hitsclick(type, name, chart_id, business_id) {
      var obj = {};
      obj.chart_id = chart_id;
      obj.business_id = business_id;
      console.log(Hits);
      Hits.clicknum(type, name, obj);
      this.$router.push({
        path: "chart",
        query: { chart_id: chart_id, business_id: business_id },
      });
    },
  },
};
</script>
