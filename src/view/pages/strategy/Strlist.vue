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
            $t("COMMON.CONTROLSTRATRGYLIST")
          }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-dialog v-model="dialog" max-width="1200px" scrollable>
            <template v-slot:activator="{ on, attrs }">
              <router-link :to="{ name: 'strategylist' }"
                ><v-btn color="primary" dark class="mb-2 ml-2">{{
                  $t("COMMON.RETURN")
                }}</v-btn></router-link
              >
              <v-btn
                color="primary"
                dark
                class="mb-2"
                v-bind="attrs"
                v-on="on"
                >{{ $t("COMMON.NEWSTRATRGYLIST") }}</v-btn
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
                    {{ $t("COMMON.ADDSTRATRGYLIST") }}
                  </h5>
                </v-card-title>
                <v-card-text>
                  <v-container>
                    <v-text-field
                      v-model="editedItem.id"
                      label="Id"
                      v-show="false"
                    ></v-text-field>
                    <v-row>
                      <v-col cols="12" xs="12" md="3" class="col-py-0">
                        <!-- 策略名称 -->
                        <div class="text-title">{{ $t("COMMON.STRATRGYLISTNAME") }}：</div>
                        <!-- 请输入名称 -->
                        <v-text-field v-model="editedItem.name" :label="$t('COMMON.PLACEHOLDER6')" :rules="[nameRules]" required></v-text-field>
                      </v-col>
                      <v-col cols="12" xs="12" md="3" class="col-py-0">
                        <!-- 策略描述 -->
                        <div class="text-title">{{ $t("COMMON.STRATRGYLISTDES") }}：</div>
                        <!-- 请输入描述 -->
                        <v-text-field v-model="editedItem.describe" :label="$t('COMMON.PLACEHOLDER7')" :rules="describeRules" required></v-text-field>
                      </v-col>
                      <v-col cols="12" xs="12" md="3" class="col-py-0">
                        <!-- 策略优先级 -->
                        <div class="text-title">{{ $t("COMMON.POLICYPRIORITY") }}：</div>
                        <!-- 请输入 -->
                        <v-text-field v-model="editedItem.sort" :label="$t('COMMON.PLACEHOLDER16')" :rules="valueRules" required></v-text-field>
                        <!-- 备注：值越小优先级越高 -->
                        <div class="remarks text-danger">{{ $t("COMMON.TEXT1") }}</div>
                      </v-col>
                      <v-col cols="12" xs="12" md="3" class="col-py-0">
                        <!-- 策略类型 -->
                        <div class="text-title">{{ $t("COMMON.STRATRGYLISTTYPE") }} </div>
                        <!-- 策略类型: 设备条件类型, 时间条件类型 -->
                        <el-select v-model="editedItem.type" @change="changeType(editedItem.type)" :popper-append-to-body="true" class="width-100 vselect" style="margin-top: 16px">
                          <el-option v-for="(t, index) in strategy" :key="index" :value="t.id" :label="t.name"></el-option>
                        </el-select>
                      </v-col>
                    </v-row>
                    <!-- 触发条件 -->
                    <div class="text-title font-weight-bolder my-2">{{ $t("COMMON.TRIGGERCONDITIONS") }}：</div>
                    <div class="box">
                      <v-row v-for="(i, index) in tjarr" :key="index" v-show="editedItem.isshowsb" style="padding: 8px 4px">
                        <v-col cols="12" xs="12" md="1" class="col-py-0">

                          <el-select v-show="i.isshowrel" v-model="i.operator" class="width-100 vselect">
                            <el-option v-for="(t, index) in relationship" :key="index" :value="t.id" :label="t.name"></el-option>
                          </el-select>
                        </v-col>
                        <v-col cols="12" xs="12" md="11" class="col-py-0"></v-col>
                        <v-col cols="12" xs="12" md="2" class="col-py-0">
                          <!-- 选择业务-->
                          <treeselect
                            v-model="i.asset_id"
                            :multiple="false"
                            :placeholder="$t('COMMON.PLACEHOLDER8')"
                            :clearable="false"
                            :searchable="false"
                            :options="i.device"
                            :normalizer="normalizer"
                            class="treeselect strtreesel width-100"
                            @input="changeStr(index, i.asset_id, 1)"
                          />
                        </v-col>
                        <v-col cols="12" xs="6" md="2" class="col-py-0">

                          <el-select
                            v-model="i.device_id"
                            @change="changeSb(index, i.device_id, 1)"
                            class="width-100 vselect"
                          >
                            <el-option
                              v-for="(t, index) in i.conditionArr"
                              :key="index"
                              :value="t.id"
                              :label="t.name"
                            ></el-option>
                          </el-select>
                        </v-col>
                        <v-col cols="12" xs="6" md="2" class="col-py-0">

                          <el-select
                            v-model="i.field"
                            @change="changeCgq(index, i.field, 1)"
                            class="width-100 vselect"
                          >
                            <el-option
                              v-for="(t, index) in i.assemblyArr"
                              :key="index"
                              :value="t.key"
                              :label="t.name"
                            ></el-option>
                          </el-select>
                        </v-col>
                        <v-col
                          cols="12"
                          xs="6"
                          md="2"
                          class="col-py-0"
                          v-show="i.isvalshow"
                        >

                          <el-select
                            v-model="i.condition"
                            class="width-100 vselect"
                          >
                            <el-option
                              v-for="(t, index) in symbols"
                              :key="index"
                              :value="t.id"
                              :label="t.name"
                            ></el-option>
                          </el-select>
                        </v-col>
                        <v-col
                          cols="12"
                          sm="6"
                          md="1"
                          class="col-py-0"
                          v-show="i.isvalshow"
                        >
                          <!-- 输入值 -->
                          <v-text-field
                            :label="$t('COMMON.PLACEHOLDER10')"
                            v-model="i.inputvalue"
                            class="vselect"
                          ></v-text-field>
                        </v-col>
                        <v-col
                          cols="12"
                          sm="6"
                          md="2"
                          class="col-py-0 text-center"
                          v-show="i.isswitchshow"
                        >
                          <v-radio-group
                            v-model="i.kgvalue"
                            row
                            required
                            class="vselect mar-top-8"
                          >
                            <v-radio
                              v-for="s in switcharr"
                              :key="s.id"
                              :label="s.name"
                              :value="s.id"
                              class="text-white"
                            ></v-radio>
                          </v-radio-group>
                        </v-col>
                        <v-col
                          cols="12"
                          xs="6"
                          md="1"
                          class="col-py-0"
                          v-show="i.isswitchshow"
                          >
                          <!-- 持续 -->
                          <div class="text-title mar-top-8 text-center vselect">
                            {{ $t("COMMON.CONTINUED") }}
                          </div></v-col
                        >
                        <v-col
                          cols="12"
                          sm="6"
                          md="1"
                          class="col-py-0"
                          v-show="i.isswitchshow"
                        >
                          <v-text-field
                            v-model="i.duration"
                            class="vselect"
                          ></v-text-field>
                        </v-col>
                        <v-col
                          cols="12"
                          xs="6"
                          md="1"
                          class="col-py-0"
                          v-show="i.isswitchshow"
                          ><div
                            class="text-title mar-top-8 text-center vselect"
                          >
                            {{ $t("COMMON.MINUTE") }}
                          </div></v-col
                        >
                        <v-col cols="12" xs="6" md="1">
                          <span class="text-white">{{ i.unit }}</span>
                        </v-col>
                        <v-col cols="12" xs="6" md="1">
                          <v-btn
                            :color="i.btncolor"
                            class="tjbtn vselect"
                            small
                            @click="clickData(index, i.event)"
                            >{{ i.btn }}</v-btn
                          >
                        </v-col>
                      </v-row>
                      <v-row
                        v-show="editedItem.isshowsj"
                        v-for="(rule, r) in rulesarr" :key="r"
                        style="padding: 20px 4px; margin-top: -25px"
                      >
                        <v-col cols="12" sm="6" md="2" class="col-py-0 mt-3">
                          <!-- <v-select
                                                            :items="timetype"
                                                            item-value="id"
                                                            item-text="name"
                                                            :label="$t('COMMON.PLACEHOLDER30')"
                                                            v-model="rule.interval"
                                                            class="vselect mt-1"
                                                            @change="choosetime(rule.interval,r)"
                                                    ></v-select> -->
                          <el-select
                            v-model="rule.interval"
                            @change="choosetime(rule.interval, r)"
                            class="width-100 vselect"
                          >
                            <el-option
                              v-for="(t, index) in timetype"
                              :key="index"
                              :value="t.id"
                              :label="t.name"
                            ></el-option>
                          </el-select>
                        </v-col>
                        <v-col cols="12" xs="6" md="3" class="col-py-0">
                          <!-- 触发时间点 -->
                          <date-picker
                            :type="rule.datetype"
                            class="datepickers strtimes"
                            :placeholder="$t('COMMON.PLACEHOLDER13')"
                            v-model="rule.time"
                            locale="zh-cn"
                            :format="rule.format_times"
                            :locale-config="localeConfig"
                            auto-submit
                          ></date-picker>
                        </v-col>
                        <v-col cols="12" xs="6" md="2" class="col-py-0">
                          <v-btn
                            :color="rule.btncolor"
                            class="rulebtn mt-5"
                            small
                            @click="addRules(r, rule.event)"
                            >{{ rule.btn }}</v-btn
                          >
                        </v-col>
                      </v-row>
                    </div>
                    <!-- 控制指令 -->
                    <div class="text-title font-weight-bolder my-2">
                      {{ $t("COMMON.CONTROLINSTRUCTION") }}：
                    </div>
                    <div class="box">
                      <v-row
                        v-for="(i, m) in instructionsarr"
                        :key="m"
                        style="padding: 8px 4px"
                      >
                        <v-col cols="12" xs="12" md="2" class="col-py-0">
                          <!-- 选择业务 -->
                          <treeselect
                            v-model="i.asset_id"
                            :multiple="false"
                            :placeholder="$t('COMMON.PLACEHOLDER8')"
                            :clearable="false"
                            :searchable="false"
                            :options="i.device"
                            :normalizer="normalizer"
                            class="treeselect strtreesel width-100"
                            @input="changeStr(m, i.asset_id, 2)"
                          />
                        </v-col>
                        <v-col cols="12" xs="6" md="2" class="col-py-0">
                          <!-- <v-select
                                                        :items="i.conditionArr"
                                                        :label="$t('COMMON.PLACEHOLDER3')"
                                                        item-value="id"
                                                        item-text="name"
                                                        v-model="i.device_id"
                                                        class="vselect"
                                                        @change="changeStrzl(m,i.device_id)"
                                                    ></v-select> -->
                          <el-select
                            v-model="i.device_id"
                            @change="changeStrzl(m, i.device_id)"
                            class="width-100 vselect"
                          >
                            <el-option
                              v-for="(t, index) in i.conditionArr"
                              :key="index"
                              :value="t.id"
                              :label="t.name"
                            ></el-option>
                          </el-select>
                        </v-col>
                        <v-col cols="12" xs="6" md="2" class="col-py-0">

                          <el-select
                            v-model="i.field"
                            class="width-100 vselect"
                            @change="changeInstr(m, i.field)"
                          >
                            <el-option
                              v-for="(t, index) in i.switch"
                              :key="index"
                              :value="t.key"
                              :label="t.name"
                            ></el-option>
                          </el-select>
                        </v-col>
                        <v-col cols="12" xs="6" md="2" class="col-py-0">
                          <div v-show="i.isshowswitch">
                            <v-radio-group
                              v-model="i.radiovalue"
                              row
                              class="vselect mar-top-8"
                            >
                              <v-radio
                                v-for="s in switcharr"
                                :key="s.id"
                                :label="s.name"
                                :value="s.id"
                                class="text-white"
                              ></v-radio>
                            </v-radio-group>
                          </div>
                          <div v-show="i.isshowinput">
                            <!-- 输入值 -->
                            <v-text-field
                              :label="$t('COMMON.PLACEHOLDER10')"
                              v-model="i.inputvalue"
                              class="vselect"
                            ></v-text-field>
                          </div>
                        </v-col>
                        <v-col cols="12" xs="6" md="2">
                          <v-btn
                            :color="i.btncolor"
                            class="tjbtn vselect"
                            small
                            @click="addInstruct(m, i.event)"
                            >{{ i.btn }}</v-btn
                          >
                        </v-col>
                      </v-row>
                    </div>
                    <v-row style="padding: 8px 4px">
                      <v-col col="12" class="col-py-0">
                        <!-- 策略状态-->
                        <div class="text-title xs-mt-2">
                          {{ $t("COMMON.POLICYSTATUS") }} ：
                        </div>
                        <v-radio-group v-model="editedItem.status" row required>
                          <v-radio
                            v-for="s in switcharr"
                            :key="s.id"
                            :label="s.name"
                            :value="s.id"
                            class="text-white"
                          ></v-radio>
                        </v-radio-group>
                      </v-col>
                    </v-row>
                    <!-- <v-row  v-show="editedItem.isshowsb" style="padding: 8px 4px;">
                                            <v-col col="12" class="col-py-0">
                                                <v-checkbox
                                                        v-model="editedItem.issued"
                                                        value="1"
                                                        class="mar-top--8 inline-block"
                                                ></v-checkbox>
                                                <div class="text-title xs-mt-2 inline-block position-relative bottom-8">{{ $t("COMMON.TITLE27") }}</div>
                                                <div class="remarks text-danger">({{ $t("COMMON.TEXT41") }})</div>
                                            </v-col>
                                            <div class="clear"></div>
                                        </v-row> -->
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
        <v-btn color="primary" class="mr-4" small @click="editItem(item.id)">{{
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
      {{ text }}

      <template v-slot:action="{ attrs }">
        <v-btn color="blue" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<style scoped>
/deep/ .el-select-dropdown__list {
  padding: 0;
}
.inline-block {
  display: inline-block;
}
.bottom-8 {
  bottom: 8px;
  left: 2px;
}
.mar-top--8 {
  margin-top: -8px;
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
.v-select-list {
  background: #182046 !important;
  border: 1px solid #f5f5f5;
  border-radius: 5px;
}
/deep/ .v-list-item__title {
  color: #ffffff !important;
}
/deep/ .vpd-icon-btn {
  margin: 0 !important;
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
  bottom: 10px !important;
}
.datepickers {
  position: relative;
  top: 15px;
}
.box {
  border: 1px solid #5b92ff;
  padding: 0 8px;
  margin: 10px 0;
  border-radius: 4px;
  padding-top: 10px;
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
.pos-rel-top-15 {
  position: relative;
  top: 15px;
}
.pos-rel-top-25 {
  position: relative;
  top: 25px;
}
.remarks {
  position: relative;
  bottom: 15px;
}
.mar-top-8 {
  margin-top: 8px !important;
}
.box .mar-top-8 {
  margin-top: 8px !important;
}

@media (max-width: 768px) {
  .xs-mt-2 {
    margin-top: 10px;
  }
}
</style>
<style>
/*.strtreesel .vue-treeselect__placeholder{color: #fff !important;font-size: 16px !important;}
    .strtreesel .vue-treeselect__single-value{font-size: 16px !important;}*/
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
      { text: "策略类型", class: "text-white", value: "types" },
      { text: "策略优先级", class: "text-white", value: "sort" },
      { text: "策略状态", class: "text-white", value: "status" },
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
    editedItem: {
      name: "",
      describe: "",
      status: 1,
      operator: "||",
      sort: "100",
      type: 1,
      isshowsb: true,
      isshowsj: false,
      config: {},
      issued: null,
    },
    defaultItem: {
      status: 1,
      operator: "||",
      sort: "100",
      type: 1,
      isshowsb: true,
      isshowsj: false,
    },
    describeRules: [(v) => !!v || "请输入策略描述"],
    valueRules: [
      (v) => !!v || "请输入数值",
      (v) => !isNaN(parseFloat(v)) || "请输入数字",
    ],
    propertyRules: [(v) => !!v || "请选择控制对象"],
    relationRules: [(v) => !!v || "请选择条件关系"],
    conditionRules: [(v) => !!v || "请选择条件"],
    symbolRules: [(v) => !!v || "请选择运算符"],
    instructionRules: [(v) => !!v || "请选择指令条件"],
    strtimeRules: [(v) => !!v || "请选择开始时间"],
    endtimeRules: [(v) => !!v || "请选择结束时间"],
    business_id: "",
    propertyitems: [],
    conditions: [],
    symbols: [],
    frequencies: [],
    property: "",
    switcharr: [
      { id: 0, name: "关" },
      { id: 1, name: "开" },
    ],
    relationship: [
      { id: "||", name: "或者" },
      { id: "&&", name: "并且" },
    ],
    timetype: [
      { id: 0, name: "单次" },
      { id: 1, name: "每天" },
    ],
    derelationship: "||",
    operator: "||",
    tjarr: [
      {
        device: [],
        asset_id: null,
        device_id: "",
        conditionArr: [],
        duration: 0,
        field: "",
        assemblyArr: [],
        condition: "",
        value: "",
        operator: "",
        btn: "新增一行",
        event: "add",
        btncolor: "primary",
        isshowrel: false,
        isshowtitle: true,
        isvalshow: true,
        isswitchshow: false,
        unit: "",
      },
    ],
    strtimes: "",
    endtimes: "",
    snackbar: false,
    text: "",
    timeout: 2000,
    instructionsarr: [
      {
        device: [],
        asset_id: null,
        device_id: "",
        conditionArr: [],
        switch: [],
        field: "",
        radiovalue: "",
        inputvalue: "",
        btn: "新增一行",
        event: "add",
        btncolor: "primary",
        isshowrel: false,
        isshowzltitle: true,
        isshowswitch: false,
        isshowinput: false,
      },
    ],
    instructions: [],
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
    isshowtitle: true,
    isshowzltitle: true,
    strategy: [
      { id: 1, name: "设备条件类型" },
      { id: 2, name: "时间条件类型" },
    ],
    tab: "false",
    rulesarr: [
      {
        interval: "",
        time: "",
        btn: "新增一行",
        event: "add",
        btncolor: "primary",
        datetype: "time",
        format_times: "HH:mm",
      },
    ],
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
  components: {
    Treeselect,
  },

  created() {
    var business_id = this.$route.query;
    this.business_id = business_id.id;
    // this.initialize();
    this.ajaxListData();
    this.ajaxdata();
    this.ajaxsymbolsData();
    this.ajaxfrequenciesData();
  },
  mounted() {},

  methods: {
    choosetime(id, r) {
      this.rulesarr[r]["time"] = "";
      if (id == 1) {
        this.rulesarr[r]["datetype"] = "time";
        this.rulesarr[r]["format_times"] = "HH:mm";
      } else {
        this.rulesarr[r]["datetype"] = "datetime";
        this.rulesarr[r]["format_times"] = "YYYY/M/D HH:mm";
      }
    },
    nameRules(v) {
      if (v === undefined) {
        return this.$t("COMMON.PLACEHOLDER25");
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
    ajaxListData() {
      ApiService.post(AUTH.local_url + "/automation/index", {
        business_id: this.business_id,
        page: this.page,
        limit: this.limit,
      }).then(({ data }) => {
        /*console.log('自动化列表');
                        console.log(data);*/
        if (data.code == 200) {
          if (data.data.data) {
            for (var i = 0; i < data.data.data.length; i++) {
              data.data.data[i]["no"] = i + 1;
              if (data.data.data[i]["status"] == 1) {
                data.data.data[i]["status"] = "开";
              } else {
                data.data.data[i]["status"] = "关";
              }
              if (data.data.data[i]["type"] == 1) {
                data.data.data[i]["types"] = "设备条件类型";
              } else {
                data.data.data[i]["types"] = "时间条件类型";
              }
            }
          }
          this.desserts = data.data.data;
          // this.length = data.data.last_page;
          this.length = Math.ceil(data.data.total / data.data.per_page);
          this.page = data.data.current_page;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        }
      });
    },

    ajaxdata() {
      ApiService.post(AUTH.local_url + "/automation/property", {
        business_id: this.business_id,
      }).then(({ data }) => {
        /*console.log('设备列表');
                        console.log(data);*/
        if (data.code == 200) {
          this.propertyitems = data.data;
          this.tjarr[0]["device"] = data.data;
          this.instructionsarr[0]["device"] = data.data;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        }
      });
    },

    //调取资产
    changeStr(i, bid, type) {
      // console.log('调取策略条件');
      if (bid !== undefined) {
        ApiService.post(AUTH.local_url + "/dashboard/device", {
          asset_id: bid,
        }).then(({ data }) => {
          /*console.log('新接口');
                            console.log(data);*/
          if (data.code == 200) {
            if (type == 1) {
              // 策略条件
              this.tjarr[i]["conditionArr"] = data.data;
            } else {
              // 控制指令
              this.instructionsarr[i]["conditionArr"] = data.data;
            }
          } else if (data.code == 401) {
            this.$store.dispatch(REFRESH).then(() => {});
          }
        });
      }
    },
    changeSb(i, id, type) {
      if (id !== undefined) {
        ApiService.post(AUTH.local_url + "/automation/show", { bid: id }).then(
          ({ data }) => {
            /*console.log('字段值');
                            console.log(data);*/
            if (data.code == 200) {
              if (type == 1) {
                this.tjarr[i]["assemblyArr"] = data.data;
              } else {
                this.instructionsarr[i]["switch"] = data.data;
              }
              this.tjarr[i]["unit"] = "";
            } else if (data.code == 401) {
              this.$store.dispatch(REFRESH).then(() => {});
            }
          }
        );
      }
    },
    //选择传感器
    changeCgq(i, id, type) {
      if (type == 1) {
        for (var m = 0; m < this.tjarr[i]["assemblyArr"].length; m++) {
          if (id == this.tjarr[i]["assemblyArr"][m]["key"]) {
            if (
              this.tjarr[i]["assemblyArr"][m]["type"] == 1 ||
              this.tjarr[i]["assemblyArr"][m]["type"] == 3
            ) {
              this.tjarr[i]["isvalshow"] = true;
              this.tjarr[i]["isswitchshow"] = false;
              this.tjarr[i]["duration"] = 0;
              this.tjarr[i]["unit"] = this.tjarr[i]["assemblyArr"][m]["symbol"];
            } else {
              // console.log('开关')
              this.tjarr[i]["isvalshow"] = false;
              this.tjarr[i]["isswitchshow"] = true;
            }
            // console.log(this.tjarr[i]);
          }
        }
      }
    },
    changeStrzl(j, bid) {
      // 策略指令
      let _that = this;
      if (bid !== undefined) {
        ApiService.post(AUTH.local_url + "/automation/instruct", {
          bid: bid,
        }).then(({ data }) => {
          if (data.code == 200) {
            console.log("策略指令");
            console.log(data.data);
            let instructionsarr = _that.instructionsarr;

            if (instructionsarr[j]["isEditTag"] != 1) {
              instructionsarr[j]["isshowswitch"] = false;
              instructionsarr[j]["isshowinput"] = false;
              instructionsarr[j]["radiovalue"] = "";
              instructionsarr[j]["inputvalue"] = "";
            } else {
              instructionsarr[j]["isEditTag"] = 0;
            }
            instructionsarr[j]["switch"] = data.data;
            _that.instructionsarr = instructionsarr;
          } else if (data.code == 401) {
            this.$store.dispatch(REFRESH).then(() => {});
          }
        });
      }
    },
    // 更改触发条件对象后显示开关还是输入框
    changeInstr(m, key) {
      for (var i = 0; i < this.instructionsarr[m]["switch"].length; i++) {
        if (this.instructionsarr[m]["switch"][i]["key"] == key) {
          if (this.instructionsarr[m]["switch"][i]["type"] == 2) {
            // 开关
            this.instructionsarr[m]["isshowswitch"] = true;
            this.instructionsarr[m]["isshowinput"] = false;
          } else {
            // 输入框
            this.instructionsarr[m]["isshowswitch"] = false;
            this.instructionsarr[m]["isshowinput"] = true;
          }
        }
      }
      this.instructionsarr[m]["radiovalue"] = "";
      this.instructionsarr[m]["inputvalue"] = "";
    },

    ajaxsymbolsData() {
      ApiService.post(AUTH.local_url + "/automation/symbol").then(
        ({ data }) => {
          if (data.code == 200) {
            console.log("symbol", data)
            /*console.log('范围');
                            console.log(data);*/
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

    editItem(id) {
      let _that = this;
      ApiService.post(AUTH.local_url + "/automation/update", { id: id }).then(
        ({ data }) => {
          if (data.code == 200) {
            var arrs = JSON.parse(JSON.stringify(data.data));
            console.log("编辑数据");
            console.log(data.data);
            _that.editedItem = arrs;
            _that.editedItem.status = Number(arrs.status);
            _that.instructionsarr = arrs.config.apply;
            if (_that.editedItem.issued != "1") {
              _that.editedItem.issued = null;
            }

            _that.editedIndex = 1;
            // 判断策略的类型并展示相应内容
            if (_that.editedItem.type == 1) {
              _that.tjarr = arrs.config.rules;
              _that.editedItem.isshowsb = true;
              _that.editedItem.isshowsj = false;
              for (var i = 0; i < _that.tjarr.length; i++) {
                if (i == 0) {
                  _that.tjarr[i]["btn"] = "新增一行";
                  _that.tjarr[i]["event"] = "add";
                  _that.tjarr[i]["btncolor"] = "primary";
                  _that.tjarr[i]["isshowrel"] = false;
                  _that.tjarr[i]["isshowtitle"] = true;
                } else {
                  _that.tjarr[i]["btn"] = "删除";
                  _that.tjarr[i]["event"] = "del";
                  _that.tjarr[i]["btncolor"] = "error";
                  _that.tjarr[i]["isshowrel"] = true;
                  _that.tjarr[i]["isshowtitle"] = false;
                }
                for (var p = 0; p < _that.tjarr[i]["assemblyArr"].length; p++) {
                  if (
                    _that.tjarr[i]["field"] ==
                    _that.tjarr[i]["assemblyArr"][p]["key"]
                  ) {
                    if (
                      _that.tjarr[i]["assemblyArr"][p]["type"] == 1 ||
                      _that.tjarr[i]["assemblyArr"][p]["type"] == 3
                    ) {
                      // 输入
                      _that.tjarr[i]["isvalshow"] = true;
                      _that.tjarr[i]["isswitchshow"] = false;
                      _that.tjarr[i]["inputvalue"] = _that.tjarr[i]["value"];
                      _that.tjarr[i]["kgvalue"] = "";
                      _that.tjarr[i]["unit"] =
                        _that.tjarr[i]["assemblyArr"][p]["symbol"];
                    } else {
                      // 开关
                      _that.tjarr[i]["isvalshow"] = false;
                      _that.tjarr[i]["isswitchshow"] = true;
                      _that.tjarr[i]["inputvalue"] = "";
                      _that.tjarr[i]["kgvalue"] = _that.tjarr[i]["value"];
                    }
                  }
                }
              }
            } else {
              _that.editedItem.isshowsb = false;
              _that.editedItem.isshowsj = true;

              _that.rulesarr = arrs.config.rules;
              for (var m = 0; m < _that.rulesarr.length; m++) {
                if (m == 0) {
                  _that.rulesarr[m]["btn"] = "新增一行";
                  _that.rulesarr[m]["event"] = "add";
                  _that.rulesarr[m]["btncolor"] = "primary";
                } else {
                  _that.rulesarr[m]["btn"] = "删除";
                  _that.rulesarr[m]["event"] = "del";
                  _that.rulesarr[m]["btncolor"] = "error";
                }
                if (_that.rulesarr[m]["interval"] == 1) {
                  _that.rulesarr[m]["datetype"] = "time";
                  _that.rulesarr[m]["format_times"] = "HH:mm";
                } else {
                  _that.rulesarr[m]["datetype"] = "datetime";
                  _that.rulesarr[m]["format_times"] = "YYYY/M/D HH:mm";
                }
              }
            }
            if (_that.instructionsarr.length > 0) {
              for (var j = 0; j < _that.instructionsarr.length; j++) {
                if (j == 0) {
                  _that.instructionsarr[j]["btn"] = "新增一行";
                  _that.instructionsarr[j]["event"] = "add";
                  _that.instructionsarr[j]["btncolor"] = "primary";
                  _that.instructionsarr[j]["isshowrel"] = false;
                } else {
                  _that.instructionsarr[j]["btn"] = "删除";
                  _that.instructionsarr[j]["event"] = "del";
                  _that.instructionsarr[j]["btncolor"] = "error";
                  _that.instructionsarr[j]["isshowrel"] = true;
                }
                _that.instructionsarr[j]["isEditTag"] = 1;
                if (_that.instructionsarr[j]["switch"]) {
                  for (
                    let m = 0;
                    m < _that.instructionsarr[j]["switch"].length;
                    m++
                  ) {
                    if (
                      _that.instructionsarr[j]["field"] ==
                      _that.instructionsarr[j]["switch"][m]["key"]
                    ) {
                      if (_that.instructionsarr[j]["switch"][m]["type"] == 2) {
                        _that.instructionsarr[j]["isshowswitch"] = true;
                        _that.instructionsarr[j]["isshowinput"] = false;
                        _that.instructionsarr[j]["radiovalue"] =
                          _that.instructionsarr[j]["value"];
                        _that.instructionsarr[j]["inputvalue"] = "";
                      } else {
                        _that.instructionsarr[j]["isshowswitch"] = false;
                        _that.instructionsarr[j]["isshowinput"] = true;
                        _that.instructionsarr[j]["inputvalue"] =
                          _that.instructionsarr[j]["value"];
                        _that.instructionsarr[j]["radiovalue"] = "";
                      }
                    }
                  }
                }
              }
            } else {
              _that.instructionsarr = [
                {
                  asset_id: null,
                  device: _that.propertyitems,
                  conditionArr: [],
                  device_id: "",
                  switch: _that.instructions,
                  field: "",
                  radiovalue: "",
                  inputvalue: "",
                  btn: "新增一行",
                  event: "add",
                  btncolor: "primary",
                  isshowrel: false,
                  isshowzltitle: true,
                  isshowswitch: false,
                  isshowinput: false,
                },
              ];
            }
            _that.dialog = true;
          } else if (data.code == 401) {
            this.$store.dispatch(REFRESH).then(() => {});
          }
        }
      );
    },

    // 删除自动化
    deleteItem(item) {
      this.editedItem = Object.assign({}, item);
      const id = this.editedItem.id;
      var con = confirm(this.$t("COMMON.TITLE4"));
      if (con == true) {
        ApiService.post(AUTH.local_url + "/automation/delete", { id: id }).then(
          ({ data }) => {
            // console.log(data);
            if (data.code == 200) {
              this.text = "删除成功！";
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
      this.editedItem = {
        status: 1,
        operator: "||",
        sort: "100",
        type: 1,
        isshowsb: true,
        isshowsj: false,
        issued: null,
      };
      this.tjarr = [
        {
          asset_id: null,
          device: this.propertyitems,
          device_id: "",
          conditionArr: this.conditions,
          //field:'',
          assemblyArr: [],
          condition: "",
          value: "",
          operator: "||",
          btn: "新增一行",
          event: "add",
          btncolor: "primary",
          isshowrel: false,
          isshowtitle: true,
          isvalshow: true,
          isswitchshow: false,
        },
      ];
      this.instructionsarr = [
        {
          asset_id: null,
          device: this.propertyitems,
          device_id: "",
          switch: this.instructions,
          conditionArr: this.conditions,
          field: "",
          radiovalue: "",
          inputvalue: "",
          btn: "新增一行",
          event: "add",
          btncolor: "primary",
          isshowrel: false,
          isshowzltitle: true,
          isshowswitch: false,
          isshowinput: false,
        },
      ];
    },

    pageChange() {
      this.ajaxListData();
    },

    // 新增/删除一行
    clickData(i, type) {
      if (type == "add") {
        var obj = {
          asset_id: null,
          device: this.propertyitems,
          device_id: "",
          conditionArr: this.conditions,
          field: "",
          assemblyArr: [],
          condition: "",
          value: "",
          operator: "||",
          btn: "删除",
          event: false,
          btncolor: "error",
          isshowrel: true,
          isshowtitle: false,
          isvalshow: true,
          isswitchshow: false,
        };
        this.tjarr.push(obj);
      } else {
        var con = confirm(this.$t("COMMON.TITLE4"));
        if (con == true) {
          this.tjarr.splice(i, 1);
        }
      }
    },

    // 新增/删除指令
    addInstruct(j, type) {
      if (type == "add") {
        var obj = {
          device: this.propertyitems,
          device_id: "",
          switch: this.instructions,
          conditionArr: this.conditions,
          field: "",
          radiovalue: "",
          inputvalue: "",
          btn: "删除",
          event: false,
          btncolor: "error",
          isshowrel: true,
          isshowzltitle: false,
        };
        this.instructionsarr.push(obj);
      } else {
        var con = confirm(this.$t("COMMON.TITLE4"));
        if (con == true) {
          this.instructionsarr.splice(j, 1);
        }
      }
    },

    // 新增/删除时间条件
    addRules(r, type) {
      if (type == "add") {
        var obj = {
          interval: "",
          time: "",
          btn: "删除",
          event: "del",
          btncolor: "error",
          datetype: "time",
          format_times: "HH:mm",
        };
        this.rulesarr.push(obj);
      } else {
        var con = confirm(this.$t("COMMON.TITLE4"));
        if (con == true) {
          this.rulesarr.splice(r, 1);
        }
      }
    },

    // 切换策略类型
    changeType(id) {
      if (id == 1) {
        this.editedItem.isshowsb = true;
        this.editedItem.isshowsj = false;
      } else {
        this.editedItem.isshowsb = false;
        this.editedItem.isshowsj = true;
      }
      this.tjarr = [
        {
          asset_id: null,
          device: this.tjarr[0]["device"],
          device_id: "",
          conditionArr: this.tjarr[0]["conditionArr"],
          field: "",
          assemblyArr: [],
          condition: "",
          value: "",
          operator: "",
          btn: "新增一行",
          event: "add",
          btncolor: "primary",
          isshowrel: false,
          isshowtitle: true,
          isvalshow: true,
          isswitchshow: false,
        },
      ];
      this.editedItem.interval = "";
      this.editedItem.time = "";
      this.editedItem.issued = null;
    },
    // 新增编辑自动化
    onSubmit() {
      if (this.editedIndex > -1) {
        // 编辑
        console.log("编辑");
        var val = this.$refs.form.validate();
        if (val == true) {
          // 判断策略类型拼值
          if (this.editedItem.type == 1) {
            // 设备条件
            var conditions = [];
            for (var i = 0; i < this.tjarr.length; i++) {
              if (
                this.tjarr[i]["operator"] == "" ||
                this.tjarr[i]["operator"] == undefined
              ) {
                // 没有逻辑关系
                if (this.tjarr[i]["isvalshow"] == true) {
                  // 输入值情况
                  var ojb = {
                    asset_id: this.tjarr[i]["asset_id"],
                    field: this.tjarr[i]["field"],
                    device_id: this.tjarr[i]["device_id"],
                    condition: this.tjarr[i]["condition"],
                    value: this.tjarr[i]["inputvalue"],
                    duration: this.tjarr[i]["duration"],
                  };
                } else {
                  // 开关情况
                  var ojb = {
                    asset_id: this.tjarr[i]["asset_id"],
                    field: this.tjarr[i]["field"],
                    device_id: this.tjarr[i]["device_id"],
                    value: this.tjarr[i]["kgvalue"],
                    duration: this.tjarr[i]["duration"],
                  };
                }
              } else {
                // 存在逻辑关系
                if (this.tjarr[i]["isvalshow"] == true) {
                  // 输入值情况
                  var ojb = {
                    asset_id: this.tjarr[i]["asset_id"],
                    field: this.tjarr[i]["field"],
                    device_id: this.tjarr[i]["device_id"],
                    condition: this.tjarr[i]["condition"],
                    value: this.tjarr[i]["inputvalue"],
                    operator: this.tjarr[i]["operator"],
                    duration: this.tjarr[i]["duration"],
                  };
                } else {
                  // 开关情况
                  var ojb = {
                    asset_id: this.tjarr[i]["asset_id"],
                    field: this.tjarr[i]["field"],
                    device_id: this.tjarr[i]["device_id"],
                    value: this.tjarr[i]["kgvalue"],
                    operator: this.tjarr[i]["operator"],
                    duration: this.tjarr[i]["duration"],
                  };
                }
              }

              conditions.push(ojb);
            }
          } else {
            // 时间条件
            /*var conditions = {};
                            conditions.time = this.editedItem.time;
                            conditions.interval = this.editedItem.interval;*/
            var conditions = [];
            for (var j = 0; j < this.rulesarr.length; j++) {
              var ojb = {
                time: this.rulesarr[j]["time"],
                interval: this.rulesarr[j]["interval"],
              };
              conditions.push(ojb);
            }
          }
          var applyarr = [];
          for (var i = 0; i < this.instructionsarr.length; i++) {
            if (
              this.instructionsarr[i]["radiovalue"] === "" &&
              this.instructionsarr[i]["inputvalue"] === ""
            ) {
              applyarr = [];
            } else if (this.instructionsarr[i]["radiovalue"] !== "") {
              var ojb = {
                asset_id: this.instructionsarr[i]["asset_id"],
                field: this.instructionsarr[i]["field"],
                device_id: this.instructionsarr[i]["device_id"],
                value: this.instructionsarr[i]["radiovalue"],
              };
              applyarr.push(ojb);
            } else if (this.instructionsarr[i]["inputvalue"] !== "") {
              var ojb = {
                asset_id: this.instructionsarr[i]["asset_id"],
                field: this.instructionsarr[i]["field"],
                device_id: this.instructionsarr[i]["device_id"],
                value: this.instructionsarr[i]["inputvalue"],
              };
              applyarr.push(ojb);
            }
          }
          this.editedItem.conditions = conditions;
          this.editedItem.business_id = this.business_id;
          var config = {};
          config.rules = conditions;
          config.apply = applyarr;
          var issued = 0;
          if (this.editedItem.issued == null) {
            issued = 0;
          } else {
            // 下发选中
            issued = this.editedItem.issued;
            if (config.rules.length > 1 || config.apply.length > 1) {
              alert(
                "仅一个条件，和一个指令，且属于同一设备的情况下，方可允许下发！"
              );
              return false;
            } else if (config.rules.length == 1 && config.apply.length == 1) {
              if (
                config.rules[0]["asset_id"] == config.apply[0]["asset_id"] &&
                config.rules[0]["device_id"] == config.apply[0]["device_id"]
              ) {
                console.log("一致");
              } else {
                alert("条件和指令属于同一设备的情况下，方可允许下发！");
                return false;
              }
            }
          }
          console.log(config);
          ApiService.post(AUTH.local_url + "/automation/edit", {
            id: this.editedItem.id,
            business_id: this.editedItem.business_id,
            name: this.editedItem.name,
            describe: this.editedItem.describe,
            status: this.editedItem.status,
            sort: this.editedItem.sort,
            type: this.editedItem.type,
            issued: issued,
            config: JSON.stringify(config),
          }).then(({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.close();
              this.text = "修改成功！";
              this.snackbar = true;
              this.ajaxListData();
              this.editedItem = {
                status: 1,
                operator: "||",
                sort: "100",
                type: 1,
                isshowsb: true,
                isshowsj: false,
                issued: null,
              };
              this.tjarr = [
                {
                  asset_id: null,
                  device: this.propertyitems,
                  device_id: "",
                  conditionArr: this.conditions,
                  field: "",
                  condition: "",
                  value: "",
                  operator: "",
                  btn: "新增一行",
                  event: "add",
                  btncolor: "primary",
                  isshowrel: false,
                  isshowtitle: true,
                  isvalshow: true,
                  isswitchshow: false,
                },
              ];
              this.instructionsarr = [
                {
                  asset_id: null,
                  device: this.propertyitems,
                  device_id: "",
                  switch: this.instructions,
                  conditionArr: this.conditions,
                  field: "",
                  radiovalue: "",
                  inputvalue: "",
                  btn: "新增一行",
                  event: "add",
                  btncolor: "primary",
                  isshowrel: false,
                  isshowzltitle: true,
                  isshowswitch: false,
                  isshowinput: false,
                },
              ];
            } else {
              this.text = data.message;
              this.snackbar = true;
              this.ajaxListData();
            }
          });
        }
      } else {
        // 新增
        console.log("新增");
        var val = this.$refs.form.validate();
        if (val == true) {
          // 判断策略类型拼值
          if (this.editedItem.type == 1) {
            // 设备条件
            var conditions = [];
            for (var i = 0; i < this.tjarr.length; i++) {
              if (
                this.tjarr[i]["operator"] == "" ||
                this.tjarr[i]["operator"] == undefined
              ) {
                // 没有逻辑关系
                if (this.tjarr[i]["isvalshow"] == true) {
                  // 输入值情况
                  var ojb = {
                    asset_id: this.tjarr[i]["asset_id"],
                    field: this.tjarr[i]["field"],
                    device_id: this.tjarr[i]["device_id"],
                    condition: this.tjarr[i]["condition"],
                    value: this.tjarr[i]["inputvalue"],
                    duration: this.tjarr[i]["duration"],
                  };
                } else {
                  // 开关情况
                  var ojb = {
                    asset_id: this.tjarr[i]["asset_id"],
                    field: this.tjarr[i]["field"],
                    device_id: this.tjarr[i]["device_id"],
                    value: this.tjarr[i]["kgvalue"],
                    duration: this.tjarr[i]["duration"],
                  };
                }
              } else {
                // 存在逻辑关系
                if (this.tjarr[i]["isvalshow"] == true) {
                  // 输入值情况
                  var ojb = {
                    asset_id: this.tjarr[i]["asset_id"],
                    field: this.tjarr[i]["field"],
                    device_id: this.tjarr[i]["device_id"],
                    condition: this.tjarr[i]["condition"],
                    value: this.tjarr[i]["inputvalue"],
                    operator: this.tjarr[i]["operator"],
                    duration: this.tjarr[i]["duration"],
                  };
                } else {
                  // 开关情况
                  var ojb = {
                    asset_id: this.tjarr[i]["asset_id"],
                    field: this.tjarr[i]["field"],
                    device_id: this.tjarr[i]["device_id"],
                    value: this.tjarr[i]["kgvalue"],
                    operator: this.tjarr[i]["operator"],
                    duration: this.tjarr[i]["duration"],
                  };
                }
              }

              conditions.push(ojb);
            }
          } else {
            // 时间条件
            /*var conditions = {};
                            conditions.time = this.editedItem.time;
                            conditions.interval = this.editedItem.interval;*/
            var conditions = [];
            for (var j = 0; j < this.rulesarr.length; j++) {
              var ojb = {
                time: this.rulesarr[j]["time"],
                interval: this.rulesarr[j]["interval"],
              };
              conditions.push(ojb);
            }
          }
          var applyarr = [];
          for (var i = 0; i < this.instructionsarr.length; i++) {
            console.log(this.instructionsarr[i]["radiovalue"]);
            if (
              this.instructionsarr[i]["radiovalue"] === "" &&
              this.instructionsarr[i]["inputvalue"] === ""
            ) {
              applyarr = [];
            } else if (this.instructionsarr[i]["radiovalue"] !== "") {
              var ojb = {
                asset_id: this.instructionsarr[i]["asset_id"],
                field: this.instructionsarr[i]["field"],
                device_id: this.instructionsarr[i]["device_id"],
                value: this.instructionsarr[i]["radiovalue"],
              };
              applyarr.push(ojb);
            } else if (this.instructionsarr[i]["inputvalue"] !== "") {
              var ojb = {
                asset_id: this.instructionsarr[i]["asset_id"],
                field: this.instructionsarr[i]["field"],
                device_id: this.instructionsarr[i]["device_id"],
                value: this.instructionsarr[i]["inputvalue"],
              };
              applyarr.push(ojb);
            }
          }
          this.editedItem.conditions = conditions;
          this.editedItem.business_id = this.business_id;
          var config = {};
          config.rules = conditions;
          config.apply = applyarr;
          console.log(this.editedItem);
          console.log(config);
          var issued = 0;
          if (this.editedItem.issued == null) {
            issued = 0;
          } else {
            issued = this.editedItem.issued;
            if (config.rules.length > 1 || config.apply.length > 1) {
              alert(this.$t("COMMON.TEXT42"));
              return false;
            } else if (config.rules.length == 1 && config.apply.length == 1) {
              if (
                config.rules[0]["asset_id"] == config.apply[0]["asset_id"] &&
                config.rules[0]["device_id"] == config.apply[0]["device_id"]
              ) {
                console.log("一致");
              } else {
                alert(this.$t("COMMON.TEXT43"));
                return false;
              }
            }
          }
          ApiService.post(AUTH.local_url + "/automation/add", {
            business_id: this.editedItem.business_id,
            name: this.editedItem.name,
            describe: this.editedItem.describe,
            status: this.editedItem.status,
            sort: this.editedItem.sort,
            type: this.editedItem.type,
            issued: issued,
            config: JSON.stringify(config),
          }).then(({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.text = "新增成功！";
              this.snackbar = true;
              this.ajaxListData();
              this.editedItem = {
                status: 1,
                operator: "||",
                sort: "100",
                type: 1,
                isshowsb: true,
                isshowsj: false,
                issued: null,
              };
              this.tjarr = [
                {
                  device: this.propertyitems,
                  device_id: "",
                  conditionArr: this.conditionArr,
                  field: "",
                  condition: "",
                  value: "",
                  operator: "",
                  btn: "新增一行",
                  event: "add",
                  btncolor: "primary",
                  isshowrel: false,
                  isshowtitle: true,
                  isvalshow: true,
                  isswitchshow: false,
                },
              ];
              this.instructionsarr = [
                {
                  device: this.propertyitems,
                  device_id: "",
                  switch: this.instructions,
                  conditionArr: this.conditionArr,
                  field: "",
                  radiovalue: "",
                  inputvalue: "",
                  btn: "新增一行",
                  event: "add",
                  btncolor: "primary",
                  isshowrel: false,
                  isshowzltitle: true,
                  isshowswitch: false,
                  isshowinput: false,
                },
              ];
            } else {
              this.text = data.message;
              this.snackbar = true;
              this.ajaxListData();
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
