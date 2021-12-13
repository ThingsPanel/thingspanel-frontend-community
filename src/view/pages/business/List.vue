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
            <th
              v-for="(header, h) in headers"
              class="text-white"
              :class="h == 3 ? 'text-center width-300' : ''"
            >
              {{ $t(header.text) }}
            </th>
          </tr>
        </thead>
      </template>
      <template v-slot:item.name="{ item }">
        <router-link
          v-if="item.is_device == 0"
          :to="{ path: 'business', query: { id: item.id } }"
          class="text-white"
          >{{ item.name }}</router-link
        >
        <router-link
          v-if="item.is_device == 1"
          :to="{ path: 'editbusiness', query: { id: item.id } }"
          class="text-white"
          >{{ item.name }}</router-link
        >
      </template>
      <template v-slot:top>
        <v-toolbar flat color="" class="no-bg text-white">
          <!-- 新增用户按钮 -->
          <v-toolbar-title class="font-size-h3 font-weight-bolder">{{
            $t("COMMON.BUSINESSLIST")
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
                  <h5 class="headline text-white">{{ $t(formTitle) }}</h5>
                </v-card-title>
                <v-card-text>
                  <v-container>
                    <v-text-field
                      v-model="editedItem.id"
                      v-show="false"
                    ></v-text-field>
                    <div class="text-title">
                      {{ $t("COMMON.BUSINESSNAME") }}：
                    </div>
                    <v-text-field
                      v-model="editedItem.name"
                      :rules="[nameRules]"
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
        <router-link
          v-if="item.is_device == 0"
          :to="{ path: 'business', query: { id: item.id } }"
          ><v-btn color="primary" class="mr-4" small>{{
            $t("COMMON.ADDASSETS")
          }}</v-btn></router-link
        >
        <!--<router-link v-if="item.is_device==1" :to="{ path: 'editbusiness', query: { id: item.id }}"><v-btn color="primary" class="mr-4" small>{{$t("COMMON.EDITASSETS")}}</v-btn></router-link>-->
        <v-btn
          v-if="item.is_device == 1"
          color="primary"
          class="mr-4"
          small
          @click="hitsclick(1, item.name, item.id)"
          >{{ $t("COMMON.EDITASSETS") }}</v-btn
        >
        <v-btn color="primary" class="mr-4" small @click="editItem(item)">{{
          $t("COMMON.EDITASSETSNAME")
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
      :next-icon="nextIcon"
      :prev-icon="prevIcon"
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
</style>

<script>
import { mapState } from "vuex";
import { REGISTER } from "@/core/services/store/auth.module";
import { UPDATE_USER } from "@/core/services/store/auth.module";
import { LOGIN, LOGOUT } from "@/core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";

import { dateFormat } from "../../../utils/tool.js";
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
    limit: 6,
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
      { text: "COMMON.NAMES", class: "text-white", value: "name" },
      { text: "COMMON.TIMES", class: "text-white", value: "datetime" },
      {
        text: "COMMON.OPERATION",
        class: "text-white",
        align: "right",
        value: "actions",
        sortable: false,
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
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "COMMON.TEXT39" : "COMMON.TEXT40";
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
    nameRules(value) {
      if (value.length === 0) {
        return this.$t("COMMON.PLACEHOLDER18");
      } else {
        return true;
      }
    },
    /*initialize () {
      this.desserts = [{no:1,name:"东升大厦",datetime:'2020-02-12'},{no:2,name:"东升大厦",datetime:'2020-02-12'}];
    },*/

    ajaxdata() {
      ApiService.post(AUTH.local_url + "/business/index", {
        name: "",
        page: 1,
        limit: 10,
      }).then(({ data }) => {
        console.log("业务列表");
        console.log(data);
        if (data.code == 200) {
          var arr = [];
          for (var i = 0; i < data.data.data.length; i++) {
            var obg = {};
            obg.no = i + 1;
            obg.id = data.data.data[i]["id"];
            obg.name = data.data.data[i]["name"];
            obg.datetime = dateFormat(parseInt(data.data.data[i]["created_at"]));
            obg.is_device = data.data.data[i]["is_device"];
            console.log(obg);
            arr.push(obg);
          }
          this.length = data.data.last_page;
          this.desserts = arr;
          console.log(arr);
        } else if (data.code == 401) {
          this.$store
            .dispatch(LOGOUT)
            .then(() => this.$router.push({ name: "login" }));
        } else {
        }
      });
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
      // var con = confirm(this.$t('COMMON.TITLE4'));
      var con = confirm(
        "业务“" +
          item.name +
          "”中包含资产和设备信息，无法删除，请先删除内部的资产和设备，再删除此业务"
      );
      if(con == true){
        ApiService.post(AUTH.local_url+"/business/delete",{id:id})
        .then(({ data }) => {
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
        const name = this.editedItem.name;
        console.log(id);
        var val = this.$refs.form.validate();
        if (val == true) {
          ApiService.post(AUTH.local_url + "/business/edit", {
            name: name,
            id: id,
          }).then(({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.editedItem.name = "";
              this.ajaxdata();
            }
          });
          this.close();
        }
      } else {
        // 新增
        const name = this.editedItem.name;
        console.log(name);
        var val = this.$refs.form.validate();
        if (val == true) {
		ApiService.post(AUTH.local_url + "/business/add", {
		  name: name
          }).then(({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.editedItem.name = "";
              this.ajaxdata();
            }
          });
          this.close();

          // this.desserts.push(this.editedItem)
        }
      }
    },

    hitsclick(type, name, id) {
      console.log("点击事件");
      var obj = {};
      obj.id = id;
      console.log(Hits);
      Hits.clicknum(type, name, obj);
      this.$router.push({ path: "editbusiness", query: { id: id } });
    },
  },
};
</script>
