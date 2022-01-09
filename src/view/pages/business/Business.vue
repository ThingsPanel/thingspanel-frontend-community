<template>
  <div class="v-application width-100" data-app="true">
    <v-form
      ref="form"
      v-model="valid"
      lazy-validation
      @submit.stop.prevent="onSubmit"
      class="width-100"
    >
      <div class="card card-custom card-stretch gutter-b rounded">
        <div class="card-header no-border">
          <router-link :to="{ name: 'buslist' }"
            ><v-btn small class="float-right go-back mb-3" color="primary">{{
              $t("COMMON.RETURNBUSSLIST")
            }}</v-btn></router-link
          >
          <table class="table">
            <thead>
              <tr class="text-white">
                <th>{{ $t("COMMON.NO") }}</th>
                <th>{{ $t("COMMON.ASSETS") }}</th>
                <th>{{ $t("COMMON.EQUIPMENT") }}</th>
                <th>{{ $t("COMMON.TITLE25") }}</th>
                <th>{{ $t("COMMON.CODEMANAGE") }}</th>
                <th>{{ $t("COMMON.TITLE23") }}</th>
                <th colspan="2">{{ $t("COMMON.TITLE24") }}</th>
                <th>
                  <v-btn color="primary" small @click="addEl">{{
                    $t("COMMON.ADDLINE")
                  }}</v-btn>
                </th>
              </tr>
            </thead>
            <tbody v-for="(list, index) in lists" v-bind:key="list.id">
              <tr class="text-white">
                <td>{{ index + 1 }}</td>
                <td colspan="7">
                  <v-text-field
                    required
                    v-model="list.name"
                    :label="$t('COMMON.PLACEHOLDER1')"
                  ></v-text-field>
                </td>
                <td>
                  <i
                    class="
                      fa fa-plus-circle
                      text-white
                      mr-2
                      pointer
                      font-size-20
                    "
                    @click="additem(index)"
                  ></i>
                  <i
                    class="
                      fa fa-minus-circle
                      text-white
                      mr-2
                      pointer
                      font-size-20
                    "
                    @click="del(index, 1)"
                  ></i>
                </td>
              </tr>
              <tr class="text-white" v-for="(a, b) in list.device">
                <td></td>
                <td>
                  <v-text-field
                    required
                    v-model="a.name"
                    :label="$t('COMMON.PLACEHOLDER2')"
                  ></v-text-field>
                </td>
                <td>
                  <v-select
                    :items="items"
                    :label="$t('COMMON.PLACEHOLDER3')"
                    item-value="id"
                    item-text="name"
                    v-model="a.type"
                    @change="changedash(a.type, index, b)"
                  ></v-select>
                </td>
                <td>
                  <span
                    @click="dataadmin(list.name, a.type, index, b, 1)"
                    class="cursor-pointer"
                    >{{ $t("COMMON.MANAGE") }}</span
                  >
                </td>
                <td @click="equipment(a)" class="cursor">
                  {{ a.dm }}
                </td>
                <td>
                  {{ a.stat }}
                </td>
                <td colspan="2">
                  <span
                    class="mr-2 custom-btn my-1"
                    v-for="(dash, num) in a.dash"
                    >{{ dash.name }}</span
                  >
                </td>
                <td>
                  <i
                    class="
                      fa fa-plus-circle
                      text-white
                      mr-2
                      pointer
                      font-size-20
                    "
                    @click="addequ(index)"
                  ></i>
                  <i
                    class="
                      fa fa-minus-circle
                      text-white
                      mr-2
                      pointer
                      font-size-20
                    "
                    @click="del(index, 2, b)"
                  ></i>
                  <!--									<v-btn small color="primary" @click="addequ(index)">添加设备</v-btn>-->
                </td>
              </tr>
              <template v-for="(item, i) in list.two">
                <tr class="text-white">
                  <td>{{ index + 1 }}-{{ i + 1 }}</td>
                  <td colspan="7">
                    <v-text-field
                      required
                      v-model="item.name"
                      :label="$t('COMMON.PLACEHOLDER1')"
                    ></v-text-field>
                  </td>
                  <td>
                    <i
                      class="
                        fa fa-plus-circle
                        text-white
                        mr-2
                        pointer
                        font-size-20
                      "
                      @click="additem2(index, i)"
                    ></i>
                    <i
                      class="
                        fa fa-minus-circle
                        text-white
                        mr-2
                        pointer
                        font-size-20
                      "
                      @click="del2(index, i, 1)"
                    ></i>
                  </td>
                </tr>
                <tr class="text-white" v-for="(c, d) in item.device">
                  <td></td>
                  <td>
                    <v-text-field
                      required
                      v-model="c.name"
                      :label="$t('COMMON.PLACEHOLDER2')"
                    ></v-text-field>
                  </td>
                  <td>
                    <v-select
                      :items="items"
                      :label="$t('COMMON.PLACEHOLDER3')"
                      item-value="id"
                      item-text="name"
                      v-model="c.type"
                      @change="changedash1(c.type, index, i, d)"
                    ></v-select>
                  </td>
                  <td>
                    <span
                      @click="dataadmin2(item.name, c.type, index, i, d, 2)"
                      class="cursor-pointer"
                      >{{ $t("COMMON.MANAGE") }}</span
                    >
                  </td>
                  <td @click="equipment(c)" class="cursor">
                    {{ c.dm }}
                  </td>
                  <td>
                    {{ c.state }}
                  </td>
                  <td colspan="2">
                    <span
                      class="mr-2 custom-btn my-1"
                      v-for="(da, nu) in c.dash"
                      >{{ da.name }}</span
                    >
                  </td>
                  <td>
                    <i
                      class="
                        fa fa-plus-circle
                        text-white
                        mr-2
                        pointer
                        font-size-20
                      "
                      @click="addequ2(index, i)"
                    ></i>
                    <i
                      class="
                        fa fa-minus-circle
                        text-white
                        mr-2
                        pointer
                        font-size-20
                      "
                      @click="del2(index, i, 2, d)"
                    ></i>
                    <!--										<v-btn small color="primary" @click="addequ2(index,i)">添加设备</v-btn>-->
                  </td>
                </tr>
                <template v-for="(v, m) in item.there">
                  <tr class="text-white">
                    <td>{{ index + 1 }}-{{ i + 1 }}-{{ m + 1 }}</td>
                    <td colspan="7">
                      <v-text-field
                        required
                        v-model="v.name"
                        :label="$t('COMMON.PLACEHOLDER1')"
                      ></v-text-field>
                    </td>
                    <td>
                      <i
                        class="
                          fa fa-minus-circle
                          text-white
                          mr-2
                          pointer
                          font-size-20
                        "
                        @click="del3(index, i, m, 1)"
                      ></i>
                    </td>
                  </tr>
                  <tr class="text-white" v-for="(e, f) in v.device">
                    <td></td>
                    <td>
                      <v-text-field
                        required
                        v-model="e.name"
                        :label="$t('COMMON.PLACEHOLDER2')"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-select
                        :items="items"
                        :label="$t('COMMON.PLACEHOLDER3')"
                        item-value="id"
                        item-text="name"
                        v-model="e.type"
                        @change="changedash2(e.type, index, i, m, f)"
                      ></v-select>
                    </td>
                    <td>
                      <span
                        @click="dataadmin3(v.name, e.type, index, i, m, f, 3)"
                        class="cursor-pointer"
                        >{{ $t("COMMON.MANAGE") }}</span
                      >
                    </td>
                    <td @click="equipment(e)" class="cursor">
                      {{ e.dm }}
                    </td>
                    <td>
                      {{ e.state }}
                    </td>
                    <td colspan="2">
                      <span
                        class="mr-2 custom-btn my-1"
                        v-for="(d, n) in e.dash"
                        >{{ d.name }}</span
                      >
                    </td>
                    <td>
                      <i
                        class="
                          fa fa-plus-circle
                          text-white
                          mr-2
                          pointer
                          font-size-20
                        "
                        @click="addequ3(index, i, f)"
                      ></i>
                      <i
                        class="
                          fa fa-minus-circle
                          text-white
                          mr-2
                          pointer
                          font-size-20
                        "
                        @click="del3(index, i, m, 2, f)"
                      ></i>
                      <!--											<v-btn small color="primary" @click="addequ3(index,i,f)">添加设备</v-btn>-->
                    </td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
          <v-btn small color="primary mb-4" @click="onSubmit">{{
            $t("COMMON.SAVE")
          }}</v-btn>
        </div>
      </div>
    </v-form>
    <!-- 模态框 -->
    <v-row justify="center">
      <v-form ref="form" lazy-validation @submit.stop.prevent="onEqSubmit">
        <v-dialog v-model="dialog" max-width="500">
          <v-card class="card">
            <v-card-title>
              <h5 class="headline text-white">
                {{ equname }} {{ $t("COMMON.CODEMANAGE") }}
              </h5>
            </v-card-title>
            <v-card-text>
              <v-container>
                <v-text-field
                  label="id"
                  v-show="false"
                  v-model="equid"
                ></v-text-field>
                <v-row class="p-4">
                  <v-col cols="12" class="col-px-0">
                    <div class="text-white">{{ $t("COMMON.AGREEMENT") }}：</div>
                    <v-select
                      :items="agreementList"
                      :label="$t('COMMON.PLACEHOLDER3')"
                      item-value="name"
                      item-text="name"
                      v-model="protocol"
                      class="text-white"
                      :disabled="false"
                      @change="changeAgreement(protocol)"
                    >
                    </v-select>
                    <!-- 							<v-text-field
    							label="agreement"
    							v-model="agreement"
    							></v-text-field> -->
                  </v-col>
                  <v-col cols="12" class="col-px-0">
                    <div class="text-white">
                      {{ $t("COMMON.INTERFACETYPE") }}：
                    </div>
                    <v-text-field
                      label="interface"
                      v-model="interface"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" class="col-px-0">
                    <div class="text-white">{{ $t("COMMON.TOKEN") }}：</div>
                    <v-text-field label="token" v-model="token"></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn class="canclebtn" text @click="dialog = false">{{
                $t("COMMON.CLOSE")
              }}</v-btn>
              <v-btn class="confbtn" text @click="editEqSubmit">{{
                $t("COMMON.UPDATE")
              }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-form>
    </v-row>
    <!-- 数据结构模态框 -->
    <v-row justify="center">
      <v-form ref="form" lazy-validation @submit.stop.prevent="onDataSubmit">
        <v-dialog v-model="datadialog" max-width="800">
          <v-card class="card">
            <v-card-title>
              <h5 class="headline text-white">
                {{ dataname }} {{ $t("COMMON.DATAMANAGE") }}
              </h5>
            </v-card-title>
            <v-card-text>
              <v-container>
                <table class="table">
                  <thead>
                    <tr class="text-white">
                      <th>{{ $t("COMMON.FIELDNAME1") }}</th>
                      <th>{{ $t("COMMON.ATTR1") }}</th>
                      <th>{{ $t("COMMON.OPERATION") }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in fieldarr">
                      <td>
                        <v-text-field
                          required
                          v-model="item.field_from"
                        ></v-text-field>
                      </td>
                      <td>
						  <el-select
						    v-model="item.field_to"
						    @change="selectAtrrArr($event, i, item)"
						    :popper-append-to-body="true"
						    class="optgroup form-control width-100"
						  >
						  <template  v-for="(v, m) in atrrarr">
							  <el-option
							    v-for="(s, g) in v.field"
							    :key="g"
							    :value="s.key"
							    :label="s.name"
							  ></el-option>
						  </template>
						  </el-select>
						  
                        <!-- <select
                          class="optgroup form-control"
                          v-model="item.field_to"
						  @change="selectAtrrArr($event, i, item)"
                        >
                          <optgroup v-for="(v, m) in atrrarr" :label="v.name">
                            <option v-for="(s, g) in v.field" :value="s.key">
                              {{ s.name }}
                            </option>
                          </optgroup>
                        </select> -->
                      </td>
                      <td>
                        <v-btn
                          small
                          :color="item.btncolor"
                          @click="fieldclick(i, item.btnevent)"
                          >{{ item.btnname }}</v-btn
                        >
                      </td>
                    </tr>
                  </tbody>
                </table>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn class="canclebtn" text @click="datadialog = false">{{
                $t("COMMON.CLOSE")
              }}</v-btn>
              <v-btn class="confbtn" text @click="onDataSubmit">{{
                $t("COMMON.CONFIRM")
              }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-form>
    </v-row>
  </div>
</template>
<style scope>
.table td {
  vertical-align: middle;
}
.pointer {
  cursor: pointer;
}
.go-back {
  margin-top: 20px;
}
.table td {
  padding: 0 0.75rem !important;
}
</style>
<script>
import AUTH from "@/core/services/store/auth.module";
import ApiService from "@/core/services/api.service";
import { REFRESH } from "@/core/services/store/auth.module";

export default {
  data: () => ({
    /* business_id:'',
  	customer_id:'1',
  	lists: [
	    { name: "",customer_id:'',business_id:'',type:'',name:'',dm:'代码',stat:'正常',two:[]}
	  ],
	items: [],
	valid: true, */
    dialog: false,
    business_id: "",
    customer_id: "1",
    lists: [
      {
        name: "",
        business_id: "",
        device: [{ type: "", dm: "代码", state: "正常", mapping: [] }],
        two: [],
      },
    ],
    items: [],
    valid: true,
    equname: "",
    equid: "",
    agreement: "mqtt",
    agreementList: [
      {
        name: "mqtt",
      },
      {
        name: "tcp",
      },
    ],
    agreement: "mqtt",
    interface: "json",
    token: "",
    protocol: "",
    datadialog: false,
    fieldarr: [
      {
        field_from: "",
        field_to: "",
        btnname: "新增",
        btncolor: "primary",
        btnevent: "add",
      },
    ],
    atrrarr: [],
    dataname: "",
    index1: "",
    b1: "",
    level: "",
    i1: "",
    m1: "",
    d1: "",
    f1: "",
  }),
  created() {
    var business_id = this.$route.query;
    this.business_id = business_id.id;
    this.lists[0]["business_id"] = business_id.id;
    // this.customer_id = AUTH.state.userid;
    this.sbdata();
  },
  methods: {
	  selectAtrrArr(e, i, item) {
	  	let atrr = this.atrrarr[i]
	  	item['symbol'] = atrr.field[e.target.options.selectedIndex]['symbol']
	  	console.log(e)
	  }, 
    addEl: function () {
      let cope = {
        id: 0,
        name: "",
        business_id: this.business_id,
        device: [{ type: "", dm: "代码", state: "正常", mapping: [] }],
        two: [],
      };
      this.lists.push(cope);
    },
    additem: function (index) {
      console.log(index);
      let obj = {
        id: 0,
        name: "",
        business_id: this.business_id,
        device: [{ type: "", dm: "代码", state: "正常", mapping: [] }],
        there: [],
      };
      this.lists[index]["two"].push(obj);
      console.log(this.lists);
    },
    addequ: function (index) {
      var obj = { type: "", dm: "代码", state: "正常" };
      this.lists[index]["device"].push(obj);
    },
    del: function (index, type, b) {
      var con = confirm(this.$t("COMMON.TITLE4"));
      if (con == true) {
        if (type == 1) {
          this.lists.splice(index, 1);
        } else {
          this.lists[index]["device"].splice(b, 1);
        }
      }
    },
    additem2: function (index, i) {
      let obj = {
        id: 0,
        name: "",
        business_id: this.business_id,
        device: [{ type: "", dm: "代码", state: "正常", mapping: [] }],
      };
      this.lists[index]["two"][i]["there"].push(obj);
    },
    addequ2: function (index, i) {
      var obj = { type: "", dm: "代码", state: "正常", mapping: [] };
      this.lists[index]["two"][i]["device"].push(obj);
    },
    del2: function (index, i, type, d) {
      console.log("二级删除");
      var con = confirm(this.$t("COMMON.TITLE4"));
      if (con == true) {
        if (type == 1) {
          this.lists[index]["two"].splice(i, 1);
        } else {
          this.lists[index]["two"][i]["device"].splice(d, 1);
        }
      }
    },
    addequ3: function (index, i, f) {
      console.log(this.lists);
      var obj = { type: "", dm: "代码", state: "正常", mapping: [] };
      this.lists[index]["two"][i]["there"][f]["device"].push(obj);
    },
    del3: function (index, i, m, type, f) {
      console.log("三级删除");
      var con = confirm(this.$t("COMMON.TITLE4"));
      if (con == true) {
        if (type == 1) {
          this.lists[index]["two"][i]["there"].splice(m, 1);
        } else {
          this.lists[index]["two"][i]["there"][m]["device"].splice(f, 1);
        }
      }
    },
    // 调取设备数据
    sbdata: function () {
      ApiService.post(AUTH.local_url + "/asset/index").then(({ data }) => {
        console.log("设备数据");
        console.log(data);
        if (data.code == 200) {
          var obj = { id: "-1", name: "无" };
          var arr = data.data;
          arr.unshift(obj);
          this.items = arr;
          this.fieldsj(this.items[1]["id"]);
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
          
        } else {
          console.log(data);
        }
      });
    },
    changeAgreement: function (item) {
      this.protocol = item;
    },
    equipment: function (item) {
      console.log(item);
      this.equname = item.name;
      this.equid = item.id;
      if (this.equid) {
        ApiService.post(AUTH.local_url + "/index/show", {
          did: this.equid,
        }).then(({ data }) => {
          console.log("获取设备tooken");
          console.log(data);
          if (data.code == 200) {
            if (data.data) {
              this.token = data.data.token;
              this.protocol = data.data.protocol;
            } else {
              this.token = "";
              this.protocol = "";
            }

            this.dialog = true;
          } else if (data.code == 401) {
            this.$store.dispatch(REFRESH).then(() => {});
            
          } else {
          }
        });
      } else {
        this.dialog = true;
      }
    },
    onEqSubmit: function (e) {
      var equid = this.equid;
      var agreement = this.agreement;
      var inter = this.interface;
      var token = this.token;
      console.log(equid + "|" + agreement + "|" + inter + "|" + token);
    },
    // 编辑一级菜单设备更新组件
    changedash: function (e, index, b) {
      this.lists[index]["device"][b]["mapping"] = [];
      if (e == -1) {
        this.lists[index]["device"][b]["dash"] = "";
        this.lists[index]["device"][b]["dm"] = "";
        this.lists[index]["device"][b]["state"] = "";
      } else {
        ApiService.post(AUTH.local_url + "/asset/widget", { id: e }).then(
          ({ data }) => {
            console.log("获取组件内容");
            console.log(data);
            if (data.code == 200) {
              this.lists[index]["device"][b]["dash"] = data.data;
              this.lists[index]["device"][b]["dm"] = "代码";
              this.lists[index]["device"][b]["state"] = "正常";
            } else if (data.code == 401) {
              this.$store.dispatch(REFRESH).then(() => {});
              
            } else {
              alert(data.msg);
            }
          }
        );
      }
    },
    // 编辑一级菜单设备更新组件
    changedash1: function (e, index, i, d) {
      this.lists[index]["two"][i]["device"][d]["mapping"] = [];
      if (e == -1) {
        this.lists[index]["two"][i]["device"][d]["dash"] = "";
        this.lists[index]["two"][i]["device"][d]["dm"] = "";
        this.lists[index]["two"][i]["device"][d]["state"] = "";
      } else {
        ApiService.post(AUTH.local_url + "/asset/widget", { id: e }).then(
          ({ data }) => {
            if (data.code == 200) {
              this.lists[index]["two"][i]["device"][d]["dash"] = data.data;
              this.lists[index]["two"][i]["device"][d]["dm"] = "代码";
              this.lists[index]["two"][i]["device"][d]["state"] = "正常";
            } else if (data.code == 401) {
              this.$store.dispatch(REFRESH).then(() => {});
              
            } else {
              alert(data.msg);
            }
          }
        );
      }
    },
    // 编辑三级菜单设备更新组件
    changedash2: function (e, index, i, m, f) {
      this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"] = [];
      if (e == -1) {
        this.lists[index]["two"][i]["there"][m]["device"][f]["dash"] = "";
        this.lists[index]["two"][i]["there"][m]["device"][f]["dm"] = "";
        this.lists[index]["two"][i]["there"][m]["device"][f]["state"] = "";
      } else {
        ApiService.post(AUTH.local_url + "/asset/widget", { id: e }).then(
          ({ data }) => {
            if (data.code == 200) {
              this.lists[index]["two"][i]["there"][m]["device"][f]["dash"] =
                data.data;
              this.lists[index]["two"][i]["there"][m]["device"][f]["dm"] =
                "代码";
              this.lists[index]["two"][i]["there"][m]["device"][f]["state"] =
                "正常";
            } else if (data.code == 401) {
              this.$store.dispatch(REFRESH).then(() => {});
              
            } else {
              alert(data.msg);
            }
          }
        );
      }
    },

    // 一级目录管理
    dataadmin: function (name, type, index, b, level) {
      if (this.lists[index]["device"][b]["mapping"].length > 0) {
        this.fieldarr = this.lists[index]["device"][b]["mapping"];
      } else {
        this.fieldarr = [
          {
            field_from: "",
            field_to: "",
            btnname: "新增",
            btncolor: "primary",
            btnevent: "add",
          },
        ];
      }

      this.index1 = index;
      this.b1 = b;
      this.level = level;
      this.fieldsj(type);
      this.dataname = name;
      this.datadialog = true;
    },

    // 二级目录管理
    dataadmin2: function (name, type, index, i, d, level) {
      this.fieldarr = [
        {
          field_from: "",
          field_to: "",
          btnname: "新增",
          btncolor: "primary",
          btnevent: "add",
        },
      ];
      this.index1 = index;
      this.i1 = i;
      this.d1 = d;
      this.level = level;
      this.fieldsj(type);
      this.dataname = name;
      this.datadialog = true;
    },

    // 三级目录管理
    dataadmin3: function (name, type, index, i, m, f, level) {
      this.fieldarr = [
        {
          field_from: "",
          field_to: "",
          btnname: "新增",
          btncolor: "primary",
          btnevent: "add",
        },
      ];
      this.index1 = index;
      this.i1 = i;
      this.m1 = m;
      this.f1 = f;
      this.level = level;
      this.fieldsj(type);
      this.dataname = name;
      this.datadialog = true;
    },

    // 属性数据
    fieldsj: function (field) {
      ApiService.post(AUTH.local_url + "/structure/field", {
        field: field,
      }).then(({ data }) => {
        console.log("属性数据");
        console.log(data);
        if (data.code == 200) {
          this.atrrarr = data.data;
          console.log(this.fieldarr);
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
          
        } else {
        }
      });
    },
    fieldclick: function (i, type) {
      if (type == "add") {
        var obj = {
          field_from: "",
          field_to: "",
          btnname: "删除",
          btncolor: "error",
          btnevent: "del",
        };
        this.fieldarr.push(obj);
      } else {
        var con = confirm("确定要删除该数据吗？");
        if (con == true) {
          this.fieldarr.splice(i, 1);
        }
      }
    },
    // 数据结构管理
    onDataSubmit: function () {
      if (this.level == 1) {
        // 一级目录
        this.lists[this.index1]["device"][this.b1]["mapping"] = this.fieldarr;
      } else if (this.level == 2) {
        // 二级目录
        this.lists[this.index1]["two"][this.i1]["device"][this.d1]["mapping"] =
          this.fieldarr;
      } else {
        // 三级目录
        this.lists[this.index1]["two"][this.i1]["there"][this.m1]["device"][
          this.f1
        ]["mapping"] = this.fieldarr;
      }
      this.datadialog = false;
    },
    // 编辑代码模态框
    editEqSubmit: function () {
      if (this.equid) {
        var con = confirm(this.$t("COMMON.TEXT44"));
        if (con == true) {
          console.log(this.equid);
          console.log(this.token);
          ApiService.post(AUTH.local_url + "/device/edit", {
            id: this.equid,
            token: this.token,
            protocol: this.protocol,
          }).then(({ data }) => {
            console.log("获取设备tooken");
            console.log(data);
            if (data.code == 200) {
              this.dialog = false;
              this.sbdata();
              this.datalist();
              this.dialog = false;
            } else if (data.code == 401) {
              this.$store.dispatch(REFRESH).then(() => {});
              
            } else {
            }
          });
        } else {
        }
      } else {
        if (this.level == 1) {
          // 一级目录
          this.lists[this.index1]["device"][this.b1]["mapping"] = this.fieldarr;
        } else if (this.level == 2) {
          // 二级目录
          this.lists[this.index1]["two"][this.i1]["device"][this.d1][
            "mapping"
          ] = this.fieldarr;
        } else {
          // 三级目录
          this.lists[this.index1]["two"][this.i1]["there"][this.m1]["device"][
            this.f1
          ]["mapping"] = this.fieldarr;
        }
      }
    },
    onSubmit: function (e) {
      console.log(e);
      console.log(this.lists);
      var datas = JSON.stringify(this.lists);
      console.log(datas);

      // return false;
      ApiService.post(AUTH.local_url + "/asset/add", { data: datas }).then(
        ({ data }) => {
          console.log("提交资产");
          console.log(data);
          if (data.code == 200) {
            console.log("添加成功！");
            this.$router.push({ name: "buslist" });
          } else if (data.code == 401) {
            this.$store.dispatch(REFRESH).then(() => {});
            
          } else {
          }
        }
      );
    },
  },
};
</script>
