<template>
	<div class="rounded bg-white v-application" data-app="true">
		<v-form ref="form" v-model="valid" lazy-validation @submit.stop.prevent="onSubmit">
			<div class="card card-custom card-stretch rounded">
				<div class="card-header no-border">
					<router-link :to="{ name: 'buslist' }">
						<v-btn small class="float-right go-back mb-3" color="primary">{{
              $t("COMMON.RETURNBUSSLIST")
            }}</v-btn>
					</router-link>
					<div class="table-responsive">
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
										<v-text-field required v-model="list.name" :label="$t('COMMON.PLACEHOLDER1')">
										</v-text-field>
									</td>
									<td>
										<i class="
                        fa fa-plus-circle
                        text-white
                        mr-2
                        pointer
                        font-size-20
                      " @click="additem(index)"></i>
										<i class="
                        fa fa-minus-circle
                        text-white
                        mr-2
                        pointer
                        font-size-20
                      " @click="del(index, list.id, 1)"></i>
									</td>
								</tr>
								<tr class="text-white" v-for="(a, b) in list.device">
									<td></td>
									<td>
										<v-text-field required v-model="a.name" :label="$t('COMMON.PLACEHOLDER2')">
										</v-text-field>
									</td>
									<td class="text-white">
										<el-select v-model="a.type" @change="changedash(a.type, index, b)"
											:popper-append-to-body="true" class="width-100">
											<el-option v-for="(t, index) in itemarr" :key="index" :value="t.name"
												:label="t.device"></el-option>
										</el-select>
										<!-- <v-select :items="itemarr" :label="$t('COMMON.PLACEHOLDER3')" item-value="id"
											item-text="name" v-model="a.type" class="text-white" :disabled="false"
											@change="changedash(a.type, index, b)"></v-select> -->
									</td>
									<td>
										<span @click="dataadmin(list.name, a.type, index, b, 1)"
											class="cursor-pointer">{{ $t("COMMON.MANAGE") }}</span>
									</td>
									<td @click="equipment(a)" class="cursor">
										{{ a.dm }}
									</td>
									<td>
										{{ inDateFormat(a.latesttime / 1000000) }}
									</td>
									<td colspan="2">
										<span class="mr-2 custom-btn my-1"
											v-for="(dash, num) in a.dash">{{ dash.name }}</span>
									</td>
									<td>
										<i class="
                        fa fa-plus-circle
                        text-white
                        mr-2
                        pointer
                        font-size-20
                      " @click="addequ(index)"></i>
										<i class="
                        fa fa-minus-circle
                        text-white
                        mr-2
                        pointer
                        font-size-20
                      " @click="del(index, a.id, 2, b)"></i>
										<!--									<v-btn small color="primary" @click="addequ(index)">添加设备</v-btn>-->
									</td>
								</tr>
								<template v-for="(item, i) in list.two">
									<tr class="text-white">
										<td>{{ index + 1 }}-{{ i + 1 }}</td>
										<td colspan="7">
											<v-text-field required v-model="item.name"
												:label="$t('COMMON.PLACEHOLDER1')"></v-text-field>
										</td>
										<td>
											<i class="
                          fa fa-plus-circle
                          text-white
                          mr-2
                          pointer
                          font-size-20
                        " @click="additem2(index, i)"></i>
											<i class="
                          fa fa-minus-circle
                          text-white
                          mr-2
                          pointer
                          font-size-20
                        " @click="del2(index, i, item.id, 1)"></i>
										</td>
									</tr>
									<tr class="text-white" v-for="(c, d) in item.device">
										<td></td>
										<td>
											<v-text-field required v-model="c.name" :label="$t('COMMON.PLACEHOLDER2')">
											</v-text-field>
										</td>
										<td>
											<!-- <v-select :items="itemarr" :label="$t('COMMON.PLACEHOLDER3')"
												item-value="id" item-text="name" v-model="c.type" :disabled="c.disabled"
												@change="changedash1(c.type, index, i, d)"></v-select> -->
											<el-select v-model="c.type" @change="changedash1(c.type, index, i, d)"
												:popper-append-to-body="true" class="width-100">
												<el-option v-for="(t, index) in itemarr" :key="index" :value="t.device"
													:label="t.device"></el-option>
											</el-select>
										</td>
										<td>
											<span @click="dataadmin2(item.name, c.type, index, i, d, 2)"
												class="cursor-pointer">{{ $t("COMMON.MANAGE") }}</span>
										</td>
										<td @click="equipment(c)" class="cursor">
											{{ c.dm }}
										</td>
										<td>
											{{ c.state }}
										</td>
										<td colspan="2">
											<span class="mr-2 custom-btn my-1"
												v-for="(da, nu) in c.dash">{{ da.name }}</span>
										</td>
										<td>
											<i class="
                          fa fa-plus-circle
                          text-white
                          mr-2
                          pointer
                          font-size-20
                        " @click="addequ2(index, i)"></i>
											<i class="
                          fa fa-minus-circle
                          text-white
                          mr-2
                          pointer
                          font-size-20
                        " @click="del2(index, i, c.id, 2, d)"></i>
											<!--										<v-btn small color="primary" @click="addequ2(index,i)">添加设备</v-btn>-->
										</td>
									</tr>
									<template v-for="(v, m) in item.there">
										<tr class="text-white">
											<td>{{ index + 1 }}-{{ i + 1 }}-{{ m + 1 }}</td>
											<td colspan="7">
												<v-text-field required v-model="v.name"
													:label="$t('COMMON.PLACEHOLDER1')"></v-text-field>
											</td>
											<td>
												<i class="
                            fa fa-minus-circle
                            text-white
                            mr-2
                            pointer
                            font-size-20
                          " @click="del3(index, i, v, m, v.id, 1)"></i>
											</td>
										</tr>
										<tr class="text-white" v-for="(e, f) in v.device">
											<td></td>
											<td>
												<v-text-field required v-model="e.name"
													:label="$t('COMMON.PLACEHOLDER2')"></v-text-field>
											</td>
											<td>
												<el-select v-model="e.type"
													@change="changedash2(e.type, index, i, m, f)"
													:popper-append-to-body="true" class="width-100">
													<el-option v-for="(t, index) in itemarr" :key="index"
														:value="t.device" :label="t.device"></el-option>
												</el-select>
												<!-- 		<v-select :items="itemarr" label="" item-value="id" item-text="name"
													v-model="e.type" :disabled="e.disabled"
													@change="changedash2(e.type, index, i, m, f)"></v-select> -->
											</td>
											<td>
												<span @click="dataadmin3(v.name, e.type, index, i, m, f, 3)"
													class="cursor-pointer">{{ $t("COMMON.MANAGE") }}</span>
											</td>
											<td @click="equipment(e)" class="cursor">
												{{ e.dm }}
											</td>
											<td>
												{{ e.state }}
											</td>
											<td colspan="2">
												<span class="mr-2 custom-btn my-1"
													v-for="(d, n) in e.dash">{{ d.name }}</span>
											</td>
											<td>
												<i class="
                            fa fa-plus-circle
                            text-white
                            mr-2
                            pointer
                            font-size-20
                          " @click="addequ3(index, i, f)"></i>
												<i class="
                            fa fa-minus-circle
                            text-white
                            mr-2
                            pointer
                            font-size-20
                          " @click="del3(index, i, v, m, e.id, 2, f)"></i>
												<!--											<v-btn small color="primary" @click="addequ3(index,i,f)">添加设备</v-btn>-->
											</td>
										</tr>
									</template>
								</template>
							</tbody>
						</table>
					</div>
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
								<v-text-field label="id" v-show="false" v-model="equid"></v-text-field>
								<v-row class="p-4">
									<v-col cols="12" class="col-px-0">
										<div class="text-white">{{ $t("COMMON.AGREEMENT") }}：</div>
										<el-select v-model="protocol" @change="changeAgreement(protocol)"
											:popper-append-to-body="false" class="width-100">
											<el-option v-for="(t, index) in agreementList" :key="index" :value="t.name"
												:label="t.name"></el-option>
										</el-select>
									</v-col>
									<v-col cols="12" class="col-px-0">
										<div class="text-white">默认配置：</div>
										<div class="defmsg" style="
                        padding: 10px;
                        font-size: 8px;
                        background: rgba(0, 0, 0, 0.3) !important;
                      ">
											<div class="text-white">端口：{{ port }}</div>
											<div class="text-white">发布主题：{{ publish }}</div>
											<div class="text-white">订阅主题：{{ subscribe }}</div>
											<div class="text-white">用户名：{{ username }}</div>
											<div class="text-white">密码：{{ password }}</div>
										</div>
									</v-col>
									<v-col cols="12" class="col-px-0">
										<div class="text-white">
											{{ $t("COMMON.INTERFACETYPE") }}：
										</div>
										<v-text-field label="interface" v-model="interface"></v-text-field>
									</v-col>
									<v-col cols="12" class="col-px-0">
										<div class="text-white">{{ $t("COMMON.TOKEN") }}：</div>
										<v-text-field label="token" v-model="token"></v-text-field>
									</v-col>
									<div class="text-white">
										提示：{{ $t("COMMON.PLACEHOLDER33") }}
									</div>
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
												<v-text-field required v-model="item.field_from"></v-text-field>
											</td>
											<td>
												<el-select
												  v-model="item.field_to"
												  @change="selectAtrrArr($event, i, item)"
												  :popper-append-to-body="true"
												  class="width-100"
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
												<!-- <el-select
												  v-model="item.field_to"
												  @change="selectAtrrArr($event, i, item)"
												  :popper-append-to-body="true"
												  class="width-100"
												>
													<el-option
														v-for="(s, index) in atrrarr" 
														:key="index"
														:value="s.key"
														:label="s.name"
													></el-option>
												</el-select> -->
												
												
												<!-- <select class="optgroup form-control" v-model:field_to="item.field_to"
													@change="selectAtrrArr($event, i, item)">
													<optgroup v-for="v in atrrarr" :label="v.name">
														<option v-for="s in v.field" :value="s.key">
															{{ s.name }}
														</option>
													</optgroup>
												</select> -->
											</td>
											<td>
												<v-btn small :color="item.btncolor"
													@click="fieldclick(i, item.btnevent)">{{ item.btnname }}</v-btn>
											</td>
										</tr>
									</tbody>
								</table>
							</v-container>
						</v-card-text>
						<div style="margin-left: 50px; color: #ffffff">
							提示：{{ $t("COMMON.PLACEHOLDER34") }}
						</div>
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
<style scoped>
	.defmsg {
		background: "#ffffff";
	}

	.table td {
		vertical-align: middle;
	}

	.pointer {
		cursor: pointer;
	}

	.go-back {
		margin-top: 20px;
	}

	.cursor {
		cursor: pointer;
	}

	.v-middle-80 {
		line-height: 80px;
	}

	form {
		width: 100%;
	}

	.font-size-20 {
		font-size: 20px;
	}

	.table td {
		padding: 0 0.75rem !important;
	}
</style>
<script>
	import {
		mapState
	} from "vuex";
	import AUTH from "@/core/services/store/auth.module";
	import ApiService from "@/core/services/api.service";
	import {
		REFRESH
	} from "@/core/services/store/auth.module";
	import {
		dateFormat
	} from "../../../utils/tool.js";

	export default {
		data: () => ({
			dialog: false,
			business_id: "",
			customer_id: "1",
			lists: [{
				name: "",
				business_id: "",
				device: [{
					type: "",
					dm: "代码",
					stat: "从未",
					mapping: [],
				}, ],
				two: [],
			}, ],
			itemarr: [],
			valid: true,
			equname: "",
			equid: "",
			agreement: "mqtt",
			agreementList: [{
					name: "mqtt",
				},
				{
					name: "tcp",
				},
			],
			interface: "json",
			token: "",
			protocol: "",
			port: "",
			publish: "",
			subscribe: "",
			username: "",
			password: "",
			datadialog: false,
			fieldarr: [{
				field_from: "",
				field_to: "",
				btnname: "新增",
				btncolor: "primary",
				btnevent: "add",
			}, ],
			atrrarr: [],
			dataname: "",
			index1: "",
			b1: "",
			level: "",
			i1: "",
			m1: "",
			d1: "",
			f1: "",
			equipmentItem: {},
		}),
		created() {
			console.log("接收值");
			var business_id = this.$route.query;
			console.log(business_id);
			this.business_id = business_id.id;
			/*this.lists[0]['business_id'] = business_id.id;
  	this.lists[0]['customer_id'] = 1;*/
			// this.customer_id = AUTH.state.userid;
			this.sbdata();
			this.datalist();
		},
		methods: {
			inDateFormat(timestamp) {
				if (
					timestamp == "" ||
					timestamp == null ||
					timestamp == undefined ||
					!timestamp
				) {
					return "从未";
				}

				let curDate = new Date().getTime() / 1000;
				let str = "从未";
				if (curDate - timestamp < 60) {
					str = "刚刚";
				} else if (curDate - timestamp < 60 * 2) {
					str = "一分钟以前";
				} else if (curDate - timestamp < 60 * 5) {
					str = "五分钟以前";
				} else if (curDate - timestamp < 60 * 10) {
					str = "十分钟以前";
				} else if (curDate - timestamp < 60 * 30) {
					str = "半小时以前";
				} else if (curDate - timestamp < 60 * 60) {
					str = "一小时以前";
				} else {
					str = dateFormat(timestamp);
				}

				return str;
			},
			selectAtrrArr(e, i, item) {
				// let a = this.atrrarr[i];
				item["symbol"] = item["symbol"];
				console.log(e);
			},
			addEl: function() {
				let cope = {
					id: 0,
					name: "",
					business_id: this.business_id,
					device: [{
						type: "",
						dm: "代码",
						state: "从未",
						mapping: [],
					}, ],
					two: [],
				};
				this.lists.push(cope);
			},
			additem: function(index) {
				console.log(index);
				let obj = {
					id: 0,
					name: "",
					business_id: this.business_id,
					device: [{
						type: "",
						dm: "代码",
						state: "从未",
						mapping: [],
					}, ],
					there: [],
				};
				let item = this.lists[index];
				item["two"] = [];
				item["two"].push(obj);
				this.lists.splice(index, 1, item);
				console.log(this.lists);
			},
			addequ: function(index) {
				var obj = {
					type: "",
					dm: "代码",
					state: "从未",
					mapping: [],
				};
				this.lists[index]["device"].push(obj);
			},
			del: function(index, id, type, b) {
				if (
					this.lists[index]["two"] &&
					this.lists[index]["two"].length &&
					type == 1
				) {
					alert(this.$t("COMMON.TITLE5"));
				} else {
					var con = confirm(this.$t("COMMON.TITLE4"));
					if (con == true) {
						if (id == undefined || id == 0) {
							// 新增删除
							console.log("删除成功！");
							if (type == 1) {
								this.lists.splice(index, 1);
							} else {
								this.lists[index]["device"].splice(b, 1);
							}
						} else {
							// 原有数据删除
							ApiService.post(AUTH.local_url + "/asset/delete", {
								id: id,
								type: type,
							}).then(({
								data
							}) => {
								console.log("删除一级内容");
								console.log(data);
								if (data.code == 200) {
									// this.lists = data.data;
									if (type == 1) {
										this.lists.splice(index, 1);
									} else {
										this.lists[index]["device"].splice(b, 1);
									}
								} else if (data.code == 401) {
									this.$store.dispatch(REFRESH).then(() => {});
								} else {}
							});
						}
					}
				}
			},
			additem2: function(index, i) {
				let obj = {
					id: 0,
					name: "",
					business_id: this.business_id,
					device: [{
						type: "",
						dm: "代码",
						state: "从未",
					}, ],
				};
				this.lists[index]["two"][i]["there"].push(obj);
			},
			addequ2: function(index, i) {
				var obj = {
					type: "",
					dm: "代码",
					state: "从未",
					mapping: [],
				};
				this.lists[index]["two"][i]["device"].push(obj);
			},
			del2: function(index, i, id, type, d) {
				if (
					this.lists[index]["two"][i]["there"] &&
					this.lists[index]["two"][i]["there"].length != 0
				) {
					alert(this.$t("COMMON.TITLE6"));
				} else {
					var con = confirm(this.$t("COMMON.TITLE4"));
					if (con == true) {
						console.log("二级删除");
						if (id == undefined || id == 0) {
							// 新增删除
							console.log("删除成功！");
							if (type == 1) {
								this.lists[index]["two"].splice(i, 1);
							} else {
								this.lists[index]["two"][i]["device"].splice(d, 1);
							}
						} else {
							// 原有数据删除
							ApiService.post(AUTH.local_url + "/asset/delete", {
								id: id,
								type: type,
							}).then(({
								data
							}) => {
								console.log("删除二级内容");
								console.log(data);
								if (data.code == 200) {
									// this.lists = data.data;
									if (type == 1) {
										this.lists[index]["two"].splice(i, 1);
									} else {
										this.lists[index]["two"][i]["device"].splice(d, 1);
									}
								} else if (data.code == 401) {
									this.$store.dispatch(REFRESH).then(() => {});
								} else {}
							});
						}
					}
				}
			},
			addequ3: function(index, i, f) {
				console.log(this.lists);
				var obj = {
					type: "",
					dm: "代码",
					state: "从未",
					mapping: [],
				};
				this.lists[index]["two"][i]["there"][f]["device"].push(obj);
			},
			del3: function(index, i, v, m, id, type, f) {
				var con = confirm(this.$t("COMMON.TITLE4"));
				if (con == true) {
					if (id == undefined || id == 0) {
						// 新增删除
						console.log("删除成功！");
						if (type == 1) {
							this.lists[index]["two"][i]["there"].splice(m, 1);
						} else {
							this.lists[index]["two"][i]["there"][m]["device"].splice(f, 1);
						}
					} else {
						// 原有数据删除
						ApiService.post(AUTH.local_url + "/asset/delete", {
							id: id,
							type: type,
						}).then(({
							data
						}) => {
							console.log("删除一级内容");
							console.log(data);
							if (data.code == 200) {
								// this.lists = data.data;
								if (type == 1) {
									this.lists[index]["two"][i]["there"].splice(m, 1);
								} else {
									this.lists[index]["two"][i]["there"][m]["device"].splice(f, 1);
								}
							} else if (data.code == 401) {
								this.$store.dispatch(REFRESH).then(() => {});
							} else {}
						});
					}
				}
			},
			datalist: function() {
				ApiService.post(AUTH.local_url + "/asset/list", {
						business_id: this.business_id,
					})
					.then(({
						data
					}) => {
						console.log("资产编辑列表");
						console.log(data);
						if (data.code == 200) {
							var arr = data.data;
							if (arr.length > 0) {
								console.log(arr);
								this.lists = arr;
							}
						} else {
							this.$store.dispatch(REFRESH).then(() => {});
						}
					})
					.catch(({
						response
					}) => {
						console.log(response);
					});
			},
			changeAgreement: function(item) {
				this.protocol = item;
			},
			sbdata: function() {
				ApiService.post(AUTH.local_url + "/asset/index").then(({
					data
				}) => {
					console.log("设备列表");
					console.log(data);
					if (data.code == 200) {
						var obj = {
							id: "-1",
							name: "无",
							device: "无",
						};
						var arr = data.data;
						arr.unshift(obj);
						this.itemarr = arr;
					} else if (data.code == 401) {
						this.$store.dispatch(REFRESH).then(() => {});
					} else {}
				});
			},
			onSubmit: function(e) {
				var datas = JSON.stringify(this.lists);
				ApiService.post(AUTH.local_url + "/asset/edit", {
					data: datas,
				}).then(({
					data
				}) => {
					console.log("提交资产");
					console.log(data);
					if (data.code == 200) {
						console.log("添加成功！");
						this.$router.push({
							name: "buslist",
						});
					} else if (data.code == 401) {
						this.$store.dispatch(REFRESH).then(() => {});
					} else {}
				});
			},
			equipment: function(item) {
				let _that = this;
				console.log(item);
				this.equname = item.name;
				this.equid = item.id;
				if (this.equid) {
					ApiService.post(AUTH.local_url + "/index/show", {
						did: this.equid,
					}).then(({
						data
					}) => {
						console.log("获取设备tooken");
						console.log(data);
						if (data.code == 200) {
							if (data.data) {
								_that.token = data.data.token;
								_that.protocol = data.data.protocol;
								_that.port = data.data.port;
								_that.publish = data.data.publish;
								_that.subscribe = data.data.subscribe;
								_that.username = data.data.username;
								_that.password = data.data.password;
							} else {
								_that.token = "";
								_that.protocol = "";
							}

							_that.dialog = true;
						} else if (data.code == 401) {
							this.$store.dispatch(REFRESH).then(() => {});
						} else {}
					});
				} else {
					this.dialog = true;
				}
			},
			onEqSubmit: function(e) {
				var equid = this.equid;
				var agreement = this.agreement;
				var inter = this.interface;
				var token = this.token;
				console.log(equid + "|" + agreement + "|" + inter + "|" + token);
			},
			// 编辑一级菜单设备更新组件
			changedash: function(e, index, b) {
				if (e == -1) {
					this.lists[index]["device"][b]["dash"] = "";
					this.lists[index]["device"][b]["dm"] = "";
					this.lists[index]["device"][b]["state"] = "";
				} else {
					ApiService.post(AUTH.local_url + "/asset/widget", {
						id: e,
					}).then(({
						data
					}) => {
						console.log("获取组件内容");
						console.log(data);
						if (data.code == 200) {
							this.lists[index]["device"][b]["dash"] = data.data;
							this.lists[index]["device"][b]["dm"] = "代码";
							this.lists[index]["device"][b]["state"] = "从未";
						} else if (data.code == 401) {
							this.$store.dispatch(REFRESH).then(() => {});
						} else {
							alert(data.msg);
						}
					});
				}
			},
			// 编辑一级菜单设备更新组件
			changedash1: function(e, index, i, d) {
				if (e == -1) {
					this.lists[index]["two"][i]["device"][d]["dash"] = "";
					this.lists[index]["two"][i]["device"][d]["dm"] = "";
					this.lists[index]["two"][i]["device"][d]["state"] = "";
				} else {
					ApiService.post(AUTH.local_url + "/asset/widget", {
						id: e,
					}).then(({
						data
					}) => {
						if (data.code == 200) {
							this.lists[index]["two"][i]["device"][d]["dash"] = data.data;
							this.lists[index]["two"][i]["device"][d]["dm"] = "代码";
							this.lists[index]["two"][i]["device"][d]["state"] = "从未";
						} else if (data.code == 401) {
							this.$store.dispatch(REFRESH).then(() => {});
						} else {
							alert(data.msg);
						}
					});
				}
			},
			// 编辑三级菜单设备更新组件
			changedash2: function(e, index, i, m, f) {
				if (e == -1) {
					this.lists[index]["two"][i]["there"][m]["device"][f]["dash"] = "";
					this.lists[index]["two"][i]["there"][m]["device"][f]["dm"] = "";
					this.lists[index]["two"][i]["there"][m]["device"][f]["state"] = "";
				} else {
					ApiService.post(AUTH.local_url + "/asset/widget", {
						id: e,
					}).then(({
						data
					}) => {
						if (data.code == 200) {
							this.lists[index]["two"][i]["there"][m]["device"][f]["dash"] =
								data.data;
							this.lists[index]["two"][i]["there"][m]["device"][f]["dm"] = "代码";
							this.lists[index]["two"][i]["there"][m]["device"][f]["state"] =
								"从未";
						} else if (data.code == 401) {
							this.$store.dispatch(REFRESH).then(() => {});
						} else {
							alert(data.msg);
						}
					});
				}
			},

			// 一级目录管理
			dataadmin: function(name, type, index, b, level) {
				console.log(this.lists[index]["device"][b]);
				// if (this.lists[index]["device"][b]["disabled"] == true) {
				//   // 编辑
				//   console.log(this.lists[index]["device"][b]["mapping"].length);

				// } else {
				//   // 新增
				//   this.fieldarr = [
				//     {
				//       field_from: "",
				//       field_to: "",
				//       btnname: "新增",
				//       btncolor: "primary",
				//       btnevent: "add",
				//     },
				//   ];
				// }
				if (this.lists[index]["device"][b]["mapping"].length > 0) {
					for (
						var p = 0; p < this.lists[index]["device"][b]["mapping"].length; p++
					) {
						if (p == 0) {
							this.lists[index]["device"][b]["mapping"][p]["btnname"] = "新增";
							this.lists[index]["device"][b]["mapping"][p]["btncolor"] =
								"primary";
							this.lists[index]["device"][b]["mapping"][p]["btnevent"] = "add";
						} else {
							this.lists[index]["device"][b]["mapping"][p]["btnname"] = "删除";
							this.lists[index]["device"][b]["mapping"][p]["btncolor"] = "error";
							this.lists[index]["device"][b]["mapping"][p]["btnevent"] = "del";
						}
					}
				} else {
					this.lists[index]["device"][b]["mapping"] = [{
						field_from: "",
						field_to: "",
						btnname: "新增",
						btncolor: "primary",
						btnevent: "add",
					}, ];
				}
				let data = this.lists[index]["device"][b];
				this.fieldarr = this.lists[index]["device"][b]["mapping"];
				this.index1 = index;
				this.b1 = b;
				this.level = level;
				this.fieldsj(type);
				this.dataname = data.name;
				this.datadialog = true;
			},

			// 二级目录管理
			dataadmin2: function(name, type, index, i, d, level) {
				// if (this.lists[index]["two"][i]["device"][d]["disabled"] == true) {
				//   // 编辑

				// } else {
				//   // 新增
				//   this.fieldarr = [
				//     {
				//       field_from: "",
				//       field_to: "",
				//       btnname: "新增",
				//       btncolor: "primary",
				//       btnevent: "add"
				//     }
				//   ];
				// }

				if (this.lists[index]["two"][i]["device"][d]["mapping"].length > 0) {
					for (
						var p = 0; p < this.lists[index]["two"][i]["device"][d]["mapping"].length; p++
					) {
						if (p == 0) {
							this.lists[index]["two"][i]["device"][d]["mapping"][p]["btnname"] =
								"新增";
							this.lists[index]["two"][i]["device"][d]["mapping"][p]["btncolor"] =
								"primary";
							this.lists[index]["two"][i]["device"][d]["mapping"][p]["btnevent"] =
								"add";
						} else {
							this.lists[index]["two"][i]["device"][d]["mapping"][p]["btnname"] =
								"删除";
							this.lists[index]["two"][i]["device"][d]["mapping"][p]["btncolor"] =
								"error";
							this.lists[index]["two"][i]["device"][d]["mapping"][p]["btnevent"] =
								"del";
						}
					}
				} else {
					this.lists[index]["two"][i]["device"][d]["mapping"] = [{
						field_from: "",
						field_to: "",
						btnname: "新增",
						btncolor: "primary",
						btnevent: "add",
					}, ];
				}
				this.fieldarr = this.lists[index]["two"][i]["device"][d]["mapping"];

				this.index1 = index;
				this.i1 = i;
				this.d1 = d;
				this.level = level;
				this.fieldsj(type);
				this.dataname = name;
				this.datadialog = true;
			},

			// 三级目录管理
			dataadmin3: function(name, type, index, i, m, f, level) {
				if (
					this.lists[index]["two"][i]["there"][m]["device"][f]["disabled"] == true
				) {
					// 编辑
					if (
						this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"]
						.length > 0
					) {
						for (
							var p = 0; p <
							this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"]
							.length; p++
						) {
							if (p == 0) {
								this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"][
									p
								]["btnname"] = "新增";
								this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"][
									p
								]["btncolor"] = "primary";
								this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"][
									p
								]["btnevent"] = "add";
							} else {
								this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"][
									p
								]["btnname"] = "删除";
								this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"][
									p
								]["btncolor"] = "error";
								this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"][
									p
								]["btnevent"] = "del";
							}
						}
					} else {
						this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"] = [{
							field_from: "",
							field_to: "",
							btnname: "新增",
							btncolor: "primary",
							btnevent: "add",
						}, ];
					}
					this.fieldarr =
						this.lists[index]["two"][i]["there"][m]["device"][f]["mapping"];
				} else {
					// 新增
					this.fieldarr = [{
						field_from: "",
						field_to: "",
						btnname: "新增",
						btncolor: "primary",
						btnevent: "add",
					}, ];
				}
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
			fieldsj: function(field) {
				ApiService.post(AUTH.local_url + "/structure/field", {
					field: field,
				}).then(({
					data
				}) => {
					console.log("属性数据");
					console.log(data);
					if (data.code == 200) {
						this.atrrarr = data.data;
						console.log(this.fieldarr);
					} else if (data.code == 401) {
						this.$store.dispatch(REFRESH).then(() => {});
					} else {}
				});
			},
			// 数据结构管理新增删除
			fieldclick: function(i, type) {
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
						if (this.level == 1) {
							// 一级目录
							console.log(
								this.lists[this.index1]["device"][this.b1]["mapping"][i]["id"]
							);
							if (
								this.lists[this.index1]["device"][this.b1]["mapping"][i]["id"] !==
								undefined
							) {
								this.deletefield(
									this.lists[this.index1]["device"][this.b1]["mapping"][i]["id"]
								);
							}
						} else if (this.level == 2) {
							// 二级目录
							if (
								this.lists[this.index1]["two"][this.i1]["device"][this.d1][
									"mapping"
								][i]["id"] !== undefined
							) {
								this.deletefield(
									this.lists[this.index1]["two"][this.i1]["device"][this.d1][
										"mapping"
									][i]["id"]
								);
							}
						} else {
							// 三级目录
							if (
								this.lists[this.index1]["two"][this.i1]["there"][this.m1][
									"device"
								][this.f1]["mapping"][i]["id"] !== undefined
							) {
								this.deletefield(
									this.lists[this.index1]["two"][this.i1]["there"][this.m1][
										"device"
									][this.f1]["mapping"][i]["id"]
								);
							}
						}
						this.fieldarr.splice(i, 1);
					}
				}
			},
			deletefield(id) {
				ApiService.post(AUTH.local_url + "/structure/delete", {
					id: id,
				}).then(({
					data
				}) => {
					console.log("删除数据管理");
					console.log(data);
					if (data.code == 200) {
						console.log("删除成功");
						this.datalist();
					} else if (data.code == 401) {
						this.$store.dispatch(REFRESH).then(() => {});
					} else {}
				});
			},
			// 数据结构管理
			onDataSubmit: function() {
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
			editEqSubmit: function() {
				if (this.equid) {
					var con = confirm(this.$t("COMMON.TEXT44"));
					if (con == true) {
						console.log(this.equid);
						console.log(this.token);
						ApiService.post(AUTH.local_url + "/device/edit", {
							id: this.equid,
							token: this.token,
							protocol: this.protocol,
						}).then(({
							data
						}) => {
							console.log("获取设备tooken");
							console.log(data);
							if (data.code == 200) {
								this.dialog = false;
								this.sbdata();
								this.datalist();
								this.dialog = false;
							} else if (data.code == 401) {
								this.$store.dispatch(REFRESH).then(() => {});
							} else {}
						});
					} else {}
				} else {
					this.dialog = false;
				}
			},
		},
	};
</script>
