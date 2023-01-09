<template>
  <div class="rounded p-4 card no-border v-application my-v-input" data-app="true">

    <v-data-table
      :headers="headers"
      :items="desserts"
      class="no-bg text-white"
      hide-default-footer
    >
      <template v-slot:top>
        <v-toolbar flat color="" class="no-bg text-white">
          <v-toolbar-title class="font-size-h3 font-weight-bolder">{{
            $t("COMMON.ALARMSTRATEGYLIST")
          }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <!-- 模态框 -->
          <v-dialog v-model="dialog" max-width="900px" scrollable>
            <template v-slot:activator="{ on, attrs }">
              <router-link :to="{ name: 'strategylist' }"
                ><v-btn color="primary" dark class="mb-2 ml-2">{{
                  $t("COMMON.RETURN")
                }}</v-btn></router-link
              >
             
            </template>

            <v-form
              ref="form"
              v-model="valid"
              lazy-validation
            
            >
              <v-card class="card">
                <v-card-title>
                  <h5 class="headline text-white">
                    {{ $t("COMMON.NEWALARMSTRATEGY") }}
                  </h5>
                </v-card-title>
                <v-card-text>
                  <v-container>
                    <v-text-field
                      v-model="editedItem.id"
                      label="Id"
                      v-show="false"
                    ></v-text-field>
                    <v-row style="padding: 8px 4px">
                      <v-col cols="12" xs="12" md="6" class="col-py-0">
                        <div class="text-title">
                          {{ $t("COMMON.ALARMSTRATEGYNAME") }}：
                        </div>
                        <v-text-field
                          v-model="editedItem.name"
                          :label="$t('COMMON.PLACEHOLDER6')"
                          :rules="[nameRules]"
                          required
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" xs="12" md="6" class="col-py-0">
                        <div class="text-title">
                          {{ $t("COMMON.ALARMSTRATEGYDES") }}：
                        </div>
                        <v-text-field
                          v-model="editedItem.describe"
                          :label="$t('COMMON.PLACEHOLDER7')"
                          :rules="[describeRules]"
                          required
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    <div class="text-title font-weight-bolder my-2">
                      {{ $t("COMMON.ADDRESS") }}：
                    </div>
                    <div class="box">
                      <v-row style="padding: 8px 4px">
                        <v-col cols="12" xs="12" md="6" class="col-py-0">
                          <treeselect
                            v-model="sensor"
                            :multiple="false"
                            :placeholder="$t('COMMON.PLACEHOLDER8')"
                            :clearable="false"
                            :searchable="false"
                            :options="propertyitems"
                            :normalizer="normalizer"
                            class="treeselect strtreesel width-100"
                            @input="changeStr(sensor)"
                          />
                        </v-col>
                        <v-col cols="12" xs="12" md="6" class="col-py-0">
                          <el-select
                            v-model="propertyindex"
                            :popper-append-to-body="false"
                            class="width-100 mb-2"
                            :pleaseholder="$t('COMMON.PLACEHOLDER3')"
                          >
                            <el-option
                              v-for="(r, index) in conditionArr"
                              :key="index"
                              :value="r.id"
                              :label="r.name"
                              @click.native="changeCgq(r.id)"
                            ></el-option>
                          </el-select>

                          <!-- <v-select
                            :items="conditionArr"
                            :label="$t('COMMON.PLACEHOLDER3')"
                            item-value="id"
                            item-text="name"
                            v-model="propertyindex"
                            class="vselect"
                            @change="changeCgq(propertyindex)"
                          ></v-select> -->
                        </v-col>
                      </v-row>
                    </div>
                    <div class="text-title font-weight-bolder my-2">
                      {{ $t("COMMON.TRIGGERCONDITIONS") }}：
                    </div>
                    <div class="box">
                      <v-row
                        v-for="(i, index) in tjarr" :key="index"
                        style="padding: 8px 4px"
                      >
                        <v-col cols="12" xs="12" md="2" class="col-py-0">
                          <el-select
                            v-show="i.isshowrel"
                            v-model="i.operator"
                            :popper-append-to-body="false"
                            class="width-100 mb-2"
                          >
                            <el-option
                              v-for="(r, index) in relationship"
                              :key="index"
                              :value="r.id"
                              :label="$t(r.name)"
                            ></el-option>
                          </el-select>
                        </v-col>
                        <v-col
                          cols="12"
                          xs="12"
                          md="10"
                          class="col-py-0"
                        ></v-col>
                        <v-col cols="12" xs="6" md="3" class="col-py-0">
                          <el-select
                            v-model="i.field"
                            class="width-100 mb-2"
                            :pleaseholder="$t('COMMON.PLACEHOLDER8')"
                          >
                            <el-option
                              v-for="(r, index) in conditions"
                              :key="index"
                              :value="r.key"
                              :label="r.name"
                              @click="changeCondition(index, i.field)"
                            ></el-option>
                          </el-select>

                          <!-- <v-select
                            :items="conditions"
                            :label="$t('COMMON.PLACEHOLDER8')"
                            item-value="key"
                            item-text="name"
                            v-model="i.field"
                            class="vselect"
                            :rules="[conditionRules]"
                            required
                            @change="changeCondition(index, i.field)"
                          ></v-select> -->
                        </v-col>
                        <v-col cols="12" xs="6" md="3" class="col-py-0">
                          <el-select
                            v-model="i.condition"
                            class="width-100 mb-2"
                            :pleaseholder="$t('COMMON.PLACEHOLDER9')"
                            :rules="[symbolRules]"
                          >
                            <el-option
                              v-for="(r, index) in symbols"
                              :key="r.key"
                              :value="r.id"
                              :label="r.name"
                              @click="changeCondition(index, i.field)"
                            ></el-option>
                          </el-select>

                          <!-- <v-select
                            :items="symbols"
                            :label="$t('COMMON.PLACEHOLDER9')"
                            item-value="id"
                            item-text="name"
                            v-model="i.condition"
                            class="vselect"
                            :rules="[symbolRules]"
                            required
                          ></v-select> -->
                        </v-col>
                        <v-col cols="12" sm="6" md="3" class="col-py-0">
                          <v-text-field
                            :label="$t('COMMON.PLACEHOLDER10')"
                            :rules="[valueRules]"
                            required
                            v-model="i.value"
                            class="vselect"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" xs="6" md="1">
                          <span class="text-white">{{ i.unit }}</span>
                        </v-col>
                        <v-col cols="12" xs="6" md="2">
                          <v-btn
                            :color="i.btncolor"
                            class="tjbtn vselect"
                            small
                            @click="clickData(index, i.event)"
                            >{{ $t(i.btn) }}</v-btn
                          >
                        </v-col>
                      </v-row>
                    </div>
                    <div class="text-title">
                      {{ $t("COMMON.TRIGGERCONDITIONS") }}：
                    </div>
                    <v-row style="padding: 8px 4px">
                      <v-col cols="12" xs="12" md="12" class="col-py-0">
                        <v-textarea
                          name="template"
                          filled
                          label=""
                          auto-grow
                          :value="$t('COMMON.PLACEHOLDER11')"
                          class="mt-4 text-white"
                          v-model="message"
                          :rules="[messageRules]"
                          required
                        ></v-textarea>
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
        </v-toolbar>
      </template>
      <template v-slot:item.actions="{ item }">
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
    <v-snackbar v-model="snackbar" top>
      {{ $t(text) }}

      <template v-slot:action="{ attrs }">
        <v-btn color="blue" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<style scoped>
.box {
  border: 1px solid #5b92ff;
  padding: 0 8px;
  margin: 10px 0;
  border-radius: 4px;
  padding-top: 10px;
}
.v-input textarea {
  color: #fff !important;
}
textarea {
  color: #fff !important;
}
textarea::-webkit-input-placeholder {
  /* WebKit browsers */
  color: #fff !important;
}
.theme--light.v-text-field--filled > .v-input__control > .v-input__slot {
  background: rgba(0, 0, 0, 0.2) !important;
  color: #fff !important;
}
.v-input textarea {
  color: #fff !important;
}
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
.vselect .v-select__selection {
  color: #333 !important;
}
.timebox {
  border: unset !important;
  box-shadow: unset !important;
  position: relative;
  margin-top: 17px;
  border-radius: 2px !important;
}
.tjbtn {
  margin-top: 20px;
}
.mar-top-8 {
  margin-top: 8px;
}
.blicon {
  font-size: 25px;
  position: relative;
  top: 22px;
  text-align: center;
  margin: 0 auto;
}
.box .vselect {
  margin-top: 0 !important;
  padding-top: 0 !important;
}
.box .v-text-field__details,
.box .v-messages {
  min-height: unset !important;
}
.box .v-input__slot {
  margin-bottom: 0 !important;
}
.tjbtn {
  margin-top: 20px;
  bottom: 10px !important;
}
@media (max-width: 768px) {
  .xs-mt-2 {
    margin-top: 10px;
  }
}
</style>
<style>
.strtreesel .vue-treeselect__placeholder {
  color: #fff !important;
}
.strtreesel .vue-treeselect__single-value {
}
@media (max-width: 768px) {
  .v-text-field__details {
    display: none !important;
  }
}
</style>
<script>
import { mapState } from "vuex";
import { REGISTER } from "@/core/services/store/auth.module";
import { UPDATE_USER } from "@/core/services/store/auth.module";
import { REFRESH } from "@/core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";

import ApiService from "@/core/services/api.service";

// import the component
import Treeselect from "@riophae/vue-treeselect";
// import the styles
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import "@/assets/css/style.css";
export default {
  data: () => ({
    length: 1,
    circle: false,
    disabled: false,
    /*nextIcon: "navigate_next",
            prevIcon: "navigate_before",*/
    limit: 10,
    page: 1,
    valid: true,
    dialog: false,
    passdialog: false,
    propertyindex: "",
    conditionsindex: "",
    symbolsindex: "",
    frequenciesindex: "",
    headers: [
      {
        text: "序号",
        class: "text-white",
        align: "start",
        sortable: false,
        value: "no",
      },
      { text: "规则名称", class: "text-white", value: "name" },
      { text: "规则说明", class: "text-white", value: "describe" },
      {
        text: "策略操作",
        class: "text-white",
        align: "right",
        value: "actions",
        sortable: false,
      },
    ],
    desserts: [],
    editedIndex: -1,
    editedItem: {},
    defaultItem: {},
    business_id: "",
    bid: "",
    propertyitems: [],
    conditions: [],
    symbols: [],
    frequencies: [],
    property: "",
    switcharr: [
      { id: 0, name: "COMMON.TITLE7" },
      { id: 1, name: "COMMON.TITLE8" },
    ],
    relationship: [
      { id: "||", name: "COMMON.TITLE9" },
      { id: "&&", name: "COMMON.TITLE10" },
    ],
    operator: "||",
    tjarr: [
      {
        operator: "",
        field: "",
        condition: "",
        value: "",
        btn: "COMMON.ADDLINE",
        event: "add",
        btncolor: "primary",
        isshowrel: false,
        isshowtitle: true,
        unit: "",
      },
    ],
    strtimes: "",
    endtimes: "",
    snackbar: false,
    text: "",
    timeout: 2000,
    message: "",
    conditionArr: [],
    sensor: null,
    isEditClick: 0,
  }),

  computed: {
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
    var business_id = this.$route.query.id;
    this.business_id = business_id;
    var bid = this.propertyindex;
    this.bid = bid;
    // this.initialize();
    this.ajaxListData();
    this.ajaxdata();
    this.ajaxsymbolsData();
    this.ajaxfrequenciesData();
  },
  components: {
    Treeselect,
  },
  methods: {
    nameRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.PLACEHOLDER25");
      } else {
        return true;
      }
    },
    describeRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.PLACEHOLDER26");
      } else {
        return true;
      }
    },
    valueRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.PLACEHOLDER27");
      } else {
        return true;
      }
    },
    conditionRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.PLACEHOLDER28");
      } else {
        return true;
      }
    },
    symbolRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.PLACEHOLDER29");
      } else {
        return true;
      }
    },
    messageRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.PLACEHOLDER11");
      } else {
        return true;
      }
    },
    normalizer(node) {
      return {
        id: node.id,
        label: node.name,
      };
    },
    /*initialize () {
              this.desserts = [{no:1,name:"东升大厦",datetime:'2020-02-12'},{no:2,name:"东升大厦",datetime:'2020-02-12'}];
            },*/
    ajaxListData() {
      ApiService.post(AUTH.local_url + "/warning/show", {
        wid: this.business_id,
        page: this.page,
        limit: this.limit,
      }).then(({ data }) => {
        console.log("告警列表");
        console.log(data);
        if (data.code == 200) {
          if (data.data) {
            for (var i = 0; i < data.data.length; i++) {
              data.data[i]["no"] = i + 1;
            }
          }
          this.desserts = data.data;
          // this.length = data.data.last_page;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        }
      });
    },

    ajaxdata() {
      ApiService.post(AUTH.local_url + "/automation/property", {
        business_id: this.business_id,
      }).then(({ data }) => {
        console.log("设备列表");
        console.log(data);
        if (data.code == 200) {
          this.propertyitems = data.data;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        }
      });
    },
    changeCondition(i, field) {
      for (var m = 0; m < this.conditions.length; m++) {
        if (this.conditions[m]["key"] == field) {
          this.tjarr[i]["unit"] = this.conditions[m]["symbol"];
        }
      }
    },

    changeStr(bid) {
      if (bid !== undefined) {
        ApiService.post(AUTH.local_url + "/dashboard/device", {
          asset_id: bid,
        }).then(({ data }) => {
          console.log("传感器列表");
          console.log(data);
          if (data.code == 200) {
            this.conditionArr = data.data;
            if (this.isEditClick == 0) {
              this.conditions = [];
              for (var i = 0; i < this.tjarr.length; i++) {
                this.tjarr[i]["field"] = "";
              }
            }
          } else if (data.code == 401) {
            this.$store.dispatch(REFRESH).then(() => {});
          }
        });
      }
    },

    //选择传感器
    changeCgq(id) {
      if (id !== undefined) {
        ApiService.post(AUTH.local_url + "/automation/show", { bid: id }).then(
          ({ data }) => {
            console.log("组件字段");
            console.log(data);
            if (data.code == 200) {
              this.conditions = data.data;
              for (var i = 0; i < this.tjarr.length; i++) {
                for (var m = 0; m < this.conditions.length; m++) {
                  if (this.conditions[m]["key"] == this.tjarr[i]["field"]) {
                    this.tjarr[i]["unit"] = this.conditions[m]["symbol"];
                  }
                }
              }
            } else if (data.code == 401) {
              this.$store.dispatch(REFRESH).then(() => {});
            }
          }
        );
      }
    },

    ajaxsymbolsData() {
      ApiService.post(AUTH.local_url + "/automation/symbol").then(
        ({ data }) => {
          if (data.code == 200) {
            console.log("范围");
            console.log(data);
            this.symbols = data.data;
          } else if (data.code == 401) {
            this.$store.dispatch(REFRESH).then(() => {});
          }
        }
      );
    },

    ajaxfrequenciesData() {
      ApiService.post(AUTH.local_url + "/automation/status").then(
        ({ data }) => {
          if (data.code == 200) {
            console.log("频率");
            console.log(data.data);
            this.frequencies = data.data;
          } else if (data.code == 401) {
            this.$store.dispatch(REFRESH).then(() => {});
          }
        }
      );
    },

    editItem(item) {
      console.log("编辑");
      console.log(item);
      this.editedIndex = this.desserts.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.propertyindex = this.editedItem.bid;
      this.tjarr = this.editedItem.config;
      this.message = this.editedItem.message;
      this.sensor = this.editedItem.sensor;
      this.changeStr(this.sensor);
      this.changeCgq(this.propertyindex);
      this.isEditClick = 1;
      for (var i = 0; i < this.tjarr.length; i++) {
        if (i == 0) {
          this.tjarr[i]["btn"] = "COMMON.ADDLINE";
          this.tjarr[i]["event"] = "add";
          this.tjarr[i]["btncolor"] = "primary";
          this.tjarr[i]["isshowrel"] = false;
        } else {
          this.tjarr[i]["btn"] = "COMMON.DELETE";
          this.tjarr[i]["event"] = "del";
          this.tjarr[i]["btncolor"] = "error";
          this.tjarr[i]["isshowrel"] = true;
        }
      }
      this.dialog = true;
    },

    showdialog() {
      this.isEditClick = 0;
    },

    // 删除自动化
    deleteItem(item) {
      this.editedItem = Object.assign({}, item);
      const id = this.editedItem.id;
      console.log("删除自动化");
      console.log(id);
      var con = confirm(this.$t("COMMON.TITLE4"));
      if (con == true) {
        ApiService.post(AUTH.local_url + "/warning/delete", { id: id }).then(
          ({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.text = "COMMON.TITLE11";
              this.snackbar = true;
              this.ajaxListData();
            }
          }
        );
      }
    },

    // 关闭模态框
    close() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
      this.editedItem = {};
      this.conditions = [];
      this.propertyindex = null;
      this.message = "";
      this.tjarr = [
        {
          key: "",
          val1: "",
          val2: "",
          btn: "COMMON.ADDLINE",
          event: "add",
          btncolor: "primary",
        },
      ];
    },

    pageChange() {
      this.ajaxListData();
    },

    // 新增/删除一行
    clickData(i, type) {
      console.log(type);
      if (type == "add") {
        var obj = {
          operator: "||",
          field: "",
          condition: "",
          value: "",
          btn: "COMMON.DELETE",
          event: false,
          btncolor: "error",
          isshowrel: true,
        };
        this.tjarr.push(obj);
      } else {
        var con = confirm(this.$t("COMMON.TITLE4"));
        if (con == true) {
          this.tjarr.splice(i, 1);
        }
      }
    },

    // 新增编辑自动化
    onSubmit() {
      if (this.editedIndex > -1) {
        // 编辑
        console.log("编辑");
        Object.assign(this.desserts[this.editedIndex], this.editedItem);
        var val = this.$refs.form.validate();
        if (val == true) {
          var conditions = [];
          for (var i = 0; i < this.tjarr.length; i++) {
            console.log();
            /*if(i<Number(this.tjarr.length-1)) {
                                if (this.tjarr[i]['key'] == this.tjarr[i + 1]['key']) {
                                    alert('您的策略条件有重复，请删除后再提交');
                                    return false;
                                }
                            }*/
            if (this.tjarr[i]["operator"] == "") {
              var ojb = {
                field: this.tjarr[i]["field"],
                condition: this.tjarr[i]["condition"],
                value: this.tjarr[i]["value"],
              };
            } else {
              var ojb = {
                operator: this.tjarr[i]["operator"],
                field: this.tjarr[i]["field"],
                condition: this.tjarr[i]["condition"],
                value: this.tjarr[i]["value"],
              };
            }
            conditions.push(ojb);
          }
          console.log(this.editedItem);
          console.log(conditions);
          var config = conditions;
          ApiService.post(AUTH.local_url + "/warning/edit", {
            id: this.editedItem.id,
            wid: this.business_id,
            name: this.editedItem.name,
            describe: this.editedItem.describe,
            bid: this.propertyindex,
            sensor: this.sensor,
            message: this.message,
            config: JSON.stringify(config),
          }).then(({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.text = "COMMON.TITLE12";
              this.snackbar = true;
              this.ajaxListData();
              this.editedItem = {};
              this.conditions = [];
              this.conditionArr = [];
              this.propertyindex = "";
              this.sensor = null;
              this.message = "";
              this.tjarr = [
                {
                  operator: "",
                  field: "",
                  condition: "",
                  value: "",
                  btn: "COMMON.ADDLINE",
                  event: "add",
                  btncolor: "primary",
                },
              ];
            }
          });
          this.close();
        }
      } else {
        // 新增
        console.log("新增");
        console.log(this.editedItem);
        console.log(this.tjarr);
        var val = this.$refs.form.validate();
        if (val == true) {
          var conditions = [];
          for (var i = 0; i < this.tjarr.length; i++) {
            console.log();
            /*if(i<Number(this.tjarr.length-1)) {
                                if (this.tjarr[i]['key'] == this.tjarr[i + 1]['key']) {
                                    alert('您的策略条件有重复，请删除后再提交');
                                    return false;
                                }
                            }*/
            if (this.tjarr[i]["operator"] == "") {
              var ojb = {
                field: this.tjarr[i]["field"],
                condition: this.tjarr[i]["condition"],
                value: this.tjarr[i]["value"],
              };
            } else {
              var ojb = {
                operator: this.tjarr[i]["operator"],
                field: this.tjarr[i]["field"],
                condition: this.tjarr[i]["condition"],
                value: this.tjarr[i]["value"],
              };
            }
            conditions.push(ojb);
          }
          console.log(conditions);
          console.log(this.editedItem);
          ApiService.post(AUTH.local_url + "/warning/add", {
            wid: this.business_id,
            name: this.editedItem.name,
            describe: this.editedItem.describe,
            bid: this.propertyindex,
            sensor: this.sensor,
            message: this.message,
            config: JSON.stringify(conditions),
          }).then(({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.text = "COMMON.TITLE13";
              this.snackbar = true;
              this.ajaxListData();
              this.editedItem = {};
              this.conditions = [];
              this.conditionArr = [];
              this.propertyindex = "";
              this.sensor = null;
              this.message = "";
              this.tjarr = [
                {
                  operator: "",
                  field: "",
                  condition: "",
                  value: "",
                  btn: "COMMON.ADDLINE",
                  event: "add",
                  btncolor: "primary",
                },
              ];
            }
          });
          this.close();

          // this.desserts.push(this.editedItem)
        }
      }
    },
  },
};
</script>
