<template>
  <div class="rounded p-4 card no-border v-application" data-app="true">
    <v-snackbar v-model="snackbar" top :vertical="vertical">
      {{ $t(text) }}

      <template v-slot:action="{ attrs }">
        <v-btn color="indigo" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <v-data-table
      :headers="headers"
      :hide-default-header="hideheader"
      :items="desserts"
      class="no-bg text-white"
      hide-default-footer
    >
      <template v-slot:header="{ props: { headers } }">
        <thead>
          <tr>
            <th
              v-for="(header, h) in headers"
              class="text-white"
              :class="h == 6 ? 'text-center width-300' : ''"
            >
              {{ $t(header.text) }}
            </th>
          </tr>
        </thead>
      </template>
      <template v-slot:top>
        <v-toolbar flat color="" class="no-bg text-white">
          <!-- 新增用户按钮 -->
          <v-toolbar-title class="font-size-h3 font-weight-bolder">{{
            $t("COMMON.USERS")
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
                >{{ $t("COMMON.AddUSER") }}</v-btn
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
                    <v-row>
                      <v-text-field
                        v-model="editedItem.id"
                        label="Id"
                        v-show="false"
                      ></v-text-field>
                      <v-col cols="12" md="6" class="col-px-0">
                        <div class="text-title">{{ $t("COMMON.NAME") }}：</div>
                        <v-text-field
                          v-model="editedItem.name"
                          label="Name"
                          :rules="[nameRules]"
                          required
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6" class="col-px-0">
                        <div class="text-title">{{ $t("COMMON.ROLE") }}：</div>
                        <v-radio-group
                          v-model="editedItem.is_admin"
                          row
                          required
                          :rules="[roleRules]"
                        >
                          <v-radio
                            v-for="role in roles"
                            :key="role.id"
                            :label="$t(role.name)"
                            :value="role.id"
                            class="text-white"
                          ></v-radio>
                        </v-radio-group>
                      </v-col>
                      <v-col cols="12" md="6" class="col-px-0">
                        <div class="text-title">{{ $t("COMMON.EMAIL") }}：</div>
                        <v-text-field
                          v-model="editedItem.email"
                          label="Email"
                          :rules="[emailRules]"
                          required
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6" class="col-px-0">
                        <div class="text-title">
                          {{ $t("COMMON.TELEPHONE") }}：
                        </div>
                        <v-text-field
                          v-model="editedItem.telephone"
                          label="Telephone"
                          :rules="[telephoneRules]"
                          required
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6" class="col-px-0">
                        <div class="text-title">
                          {{ $t("COMMON.BUSINESSCONFIG") }}：
                        </div>
                        <v-select
                          item-text="name"
                          item-value="id"
                          :items="busitems"
                          v-model="editedItem.work_arr"
                          class="vselect"
                        >
                        </v-select>
                      </v-col>
                      <v-col cols="12" md="6" class="col-px-0">
                        <div class="text-title">
                          {{ $t("COMMON.REMARKS") }}：
                        </div>
                        <v-text-field
                          v-model="editedItem.remarks"
                          label="Remarks"
                        ></v-text-field>
                      </v-col>

                      <v-col cols="12" md="6" class="col-px-0" v-if="seen">
                        <div class="text-title">
                          {{ $t("COMMON.PASSWORD") }}：
                        </div>
                        <v-text-field
                          v-model="editedItem.password"
                          label="Password"
                          :rules="[passwordRules]"
                          required
                        ></v-text-field>
                      </v-col>

                      <v-col cols="12" md="6" class="col-px-0" v-if="seen">
                        <div class="text-title">
                          {{ $t("COMMON.CONPASSWORD") }}：
                        </div>
                        <v-text-field
                          v-model="editedItem.conpassword"
                          label="Confirmpassword"
                          :rules="[conpasswordRules]"
                          required
                        ></v-text-field>
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

          <!-- 修改密码模态框 -->
          <v-dialog v-model="passdialog" max-width="500px">
            <v-form
              ref="form"
              v-model="valid"
              lazy-validation
              @submit.stop.prevent="onpassSubmit"
            >
              <v-card class="card">
                <v-card-title>
                  <h5 class="headline text-white">{{ editedItem.name }}</h5>
                </v-card-title>
                <v-card-text>
                  <v-container>
                    <v-row>
                      <v-text-field
                        v-model="editedItem.id"
                        label="Id"
                        v-show="false"
                      ></v-text-field>
                      <v-col cols="12" class="col-px-0" v-if="seen">
                        <div class="text-title">
                          {{ $t("COMMON.PASSWORD") }}：
                        </div>
                        <v-text-field
                          v-model="editedItem.password"
                          label="Password"
                          :rules="passwordRules"
                          required
                        ></v-text-field>
                      </v-col>

                      <v-col cols="12" class="col-px-0" v-if="seen">
                        <div class="text-title">
                          {{ $t("COMMON.CONPASSWORD") }}：
                        </div>
                        <v-text-field
                          v-model="editedItem.conpassword"
                          label="Conpassword"
                          :rules="[conpasswordRules]"
                          required
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card-text>

                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn class="canclebtn" text @click="passclose">{{
                    $t("COMMON.CANCEL")
                  }}</v-btn>
                  <v-btn class="confbtn" text @click="onpassSubmit">{{
                    $t("COMMON.SAVE")
                  }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-form>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn color="primary" class="mr-4" small @click="editItem(item)">{{
          $t("COMMON.EDIT")
        }}</v-btn>
        <v-btn color="primary" class="mr-4" small @click="resetPass(item)">{{
          $t("COMMON.CHANGEPASSWORD")
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
.vselect.theme--light.v-select .v-select__selection--comma {
  color: #000 !important;
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

export default {
  data: () => ({
    hideheader: true,
    snackbar: false,
    text: "",
    vertical: true,
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
      {
        text: "COMMON.USERNAME",
        class: "text-white",
        sortable: false,
        value: "username",
      },
      {
        text: "COMMON.NAME",
        class: "text-white",
        sortable: false,
        value: "name",
      },
      {
        text: "COMMON.EMAIL",
        class: "text-white",
        sortable: false,
        value: "email",
      },
      {
        text: "COMMON.TELEPHONE",
        class: "text-white",
        sortable: false,
        value: "telephone",
      },
      {
        text: "COMMON.ROLE",
        class: "text-white",
        sortable: false,
        value: "role",
      },
      {
        text: "COMMON.OPERATION",
        class: "text-white",
        sortable: false,
        value: "actions",
        align: "right",
      },
    ],
    busitems: [],
    defaultbus: {},
    desserts: [],
    editedIndex: -1,
    editedItem: {
      name: "",
      fat: 0,
      carbs: 0,
      protein: 0,
    },
    defaultItem: {
      name: "",
      fat: 0,
      carbs: 0,
      protein: 0,
    },
    roles: [
      {
        id: 0,
        name: "COMMON.TEXT37",
      },
      {
        id: 1,
        name: "COMMON.TEXT38",
      },
    ],
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "COMMON.TEXT35" : "COMMON.TEXT36";
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
    this.getbusiness();
  },

  methods: {
    // initialize () {
    // },
    nameRules(v) {
      if (v.length === 0) {
        return this.$t("COMMON.PLACEHOLDER17");
      } else {
        return true;
      }
    },
    roleRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.PLACEHOLDER19");
      } else {
        return true;
      }
    },
    emailRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.PLACEHOLDER20");
      } else if (/.+@.+\..+/.test(v) == false) {
        return this.$t("COMMON.PLACEHOLDER21");
      } else {
        return true;
      }
    },
    telephoneRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.PLACEHOLDER22");
      } else if (/^1[3456789]\d{9}$/.test(v) == false) {
        return this.$t("COMMON.PLACEHOLDER23");
      } else {
        return true;
      }
    },
    passwordRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.TITLE3");
      } else if (v.length < 6) {
        return this.$t("COMMON.PLACEHOLDER24");
      } else {
        return true;
      }
    },
    conpasswordRules(val) {
      if (val !== this.editedItem.password) {
        return this.$t("COMMON.TITLE14");
      }
      return true;
    },

    ajaxdata() {
      ApiService.post(AUTH.local_url + "/user/index", {
        search: "",
        limit: this.limit,
        page: this.page,
      }).then(({ data }) => {
        var that = this;
        console.log("用户数据");
        console.log(data);
        if (data.code == 200) {
          var arr = [];
          for (var i = 0; i < data.data.data.length; i++) {
            var obg = {};
            obg.no = i + 1;
            obg.id = data.data.data[i]["id"];
            obg.username = data.data.data[i]["email"];
            obg.name = data.data.data[i]["name"];
            obg.email = data.data.data[i]["email"];
            obg.telephone = data.data.data[i]["mobile"];
            obg.remarks = data.data.data[i]["remark"];
            obg.is_admin = data.data.data[i]["is_admin"];
            obg.work_arr = this.busitems[0];
            obg.business_id = data.data.data[i]["business_id"];
            for (var j = 0; j < this.busitems.length; j++) {
              if (data.data.data[i]["business_id"] == this.busitems[j]["id"]) {
                obg.work_arr = this.busitems[j];
              }
            }
            if (data.data.data[i]["is_admin"] == 0) {
              obg.role = "管理组";
            } else {
              obg.role = "普通用户";
            }
            arr.push(obg);
          }
          this.length = data.data.last_page;
          this.desserts = arr;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
          
        } else {
        }
      });
    },

    editItem(item) {
      this.seen = false;
      this.editedIndex = this.desserts.indexOf(item);
      this.editedItem = Object.assign({}, item);
      console.log(this.editedItem);
      this.dialog = true;
    },

    deleteItem(item) {
      const index = this.desserts.indexOf(item);
      confirm(this.$t("COMMON.TITLE4")) && this.desserts.splice(index, 1);
    },

    resetPass(item) {
      this.editedIndex = this.desserts.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.passdialog = true;
    },

    close() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
      this.seen = true;
    },

    passclose() {
      this.passdialog = false;
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
        var val = this.$refs.form.validate();
        console.log(val);
        if (val == true) {
          Object.assign(this.desserts[this.editedIndex], this.editedItem);
          const id = this.editedItem.id;
          const name = this.editedItem.name;
          const email = this.editedItem.email;
          const mobile = this.editedItem.telephone;
          const remark = this.editedItem.remarks;
          const is_admin = this.editedItem.is_admin;
          var business_id;
          if (this.editedItem.work_arr.id == undefined) {
            console.log(111);
            business_id = this.editedItem.work_arr;
          } else {
            console.log(222);
            business_id = this.editedItem.work_arr.id;
          }

          /*const password = this.editedItem.password;
            const password_confirmation = this.editedItem.conpassword;*/
          console.log("编辑");
          console.log(is_admin);
          ApiService.post(AUTH.local_url + "/user/edit", {
            id: id,
            name: name,
            email: email,
            mobile: mobile,
            remark: remark,
            is_admin: is_admin,
            business_id: business_id,
          }).then(({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.close();
              console.log("修改成功");
              this.seen = true;
              this.text = "COMMON.TITLE12";
              this.snackbar = true;
              this.ajaxdata();
            } else if (data.code == 401) {
              this.$store.dispatch(REFRESH).then(() => {});
              
            } else {
            }
          });
        }
      } else {
        // 新增
        var val = this.$refs.form.validate();
        if (val == true) {
          const name = this.editedItem.name;
          const is_admin = this.editedItem.is_admin;
          const email = this.editedItem.email;
          const mobile = this.editedItem.telephone;
          const business_id = this.editedItem.work_arr;
          const remark = this.editedItem.remarks;
          const password = this.editedItem.password;
          const password_confirmation = this.editedItem.conpassword;

          setTimeout(() => {
            this.$store
              .dispatch(REGISTER, {
                name: name,
                is_admin: is_admin,
                email: email,
                mobile: mobile,
                business_id: business_id,
                remark: remark,
                password: password,
                password_confirmation: password_confirmation,
              })
              .then(() => {
                console.log("新增成功");
                this.seen = true;
                this.close();
                this.text = "COMMON.TITLE13";
                this.snackbar = true;
                this.ajaxdata();
              });
          }, 2000);
          // this.desserts.push(this.editedItem)
          // this.close();
        }
      }
    },
    onpassSubmit() {
      // 重置密码
      Object.assign(this.desserts[this.editedIndex], this.editedItem);
      const id = this.editedItem.id;
      const password = this.editedItem.password;
      const password_confirmation = this.editedItem.conpassword;
      var val = this.$refs.form.validate();
      if (val == true) {
        const con = confirm(this.$t("COMMON.TITLE15"));
        if (con == true) {
          ApiService.post(AUTH.local_url + "/user/update", {
            id: id,
            password: password,
            password_confirmation: password_confirmation,
          }).then(({ data }) => {
            if (data.code == 200) {
              console.log("修改成功");
            } else if (data.code == 401) {
              this.$store.dispatch(REFRESH).then(() => {});
              
            } else {
            }
          });
        }
        this.passclose();
      }
    },

    getbusiness() {
      ApiService.post(AUTH.local_url + "/dashboard/business").then(
        ({ data }) => {
          console.log("获取业务");
          console.log(data);
          if (data.code == 200) {
            var busarr = data.data;
            this.busitems = busarr;
            this.defaultbus = busarr[0];
            console.log("原始");
            console.log(this.defaultbus);
          } else if (data.code == 401) {
            console.log("跳转登录页面");
            this.$store.dispatch(REFRESH).then(() => {});
            
          } else {
          }
        }
      );
    },
  },
};
</script>
