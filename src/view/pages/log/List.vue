<template>
	<!--begin::List Widget 9-->
	<div class="card card-custom card-stretch gutter-b v-application">
		<!--begin::Header-->
		<div class="card-header border-0">
			<!-- <h3 class="card-title font-weight-bolder text-dark">
        {{ $t("COMMON.OPERATIONLOG") }}
      </h3> -->
			<div class="searchbox float-left">
				<div class="path-search">
					<div class="title">请求路径:</div>
					<input class="searchInput" type="text" value="" placeholder="请输入请求路径" />
				</div>
				<div class="ip-search">
					<div class="title">IP:</div>
					<input class="searchInput" type="text" value="" placeholder="请输入请求路径" />
				</div>
			</div>
			<div class="datebox float-right mt-4 mr-4">
				<!-- 			<div class="wid-16 float-left">
					<date-picker type="datetime" class="datepickers strdate" v-model="start_date" locale="zh-cn" format="YYYY/M/D HH:mm:ss"
					 :locale-config="localeConfig" auto-submit></date-picker>
				</div>
				<div class="wid-16 float-left mx-6">
					<date-picker type="datetime" class="datepickers enddate" v-model="end_date" locale="zh-cn" format="YYYY/M/D HH:mm:ss"
					 :locale-config="localeConfig" auto-submit></date-picker>
				</div> -->
				<div class="float-left">
					<v-btn color="primary" @click="operation()">{{
            $t("COMMON.SEARCH")
          }}</v-btn>
					<v-btn color="white ml-4">重置</v-btn>
				</div>
			</div>
		</div>
		<!--end::Header-->

		<!--begin::Body-->
		<div class="card-body max-height">
			<div class="timeline timeline-5">
				<v-data-table :headers="headers" :hide-default-header="true" :items="list" item-key="id" class="no-bg text-white"
				 hide-default-footer>
					<template v-slot:header="{ props: { headers } }">
						<thead>
							<tr>
								<th v-for="(header, h) in headers" class="text-white" :key="h">
									{{ header.text }}
								</th>
							</tr>
						</thead>
					</template>
					<template v-slot:item.actions="{ item }">
						<v-btn color="primary" class="mr-4" small @click="clickItem(item)">详情</v-btn>
					</template>
				</v-data-table>
				<div v-show="tip" class="text-white">{{ $t("COMMON.TITLE26") }}</div>
				<v-pagination class="float-right mt-8" v-model="page" :circle="circle" :disabled="disabled" :length="length" :page="page"
				 :total-visible="limit" @input="pageChange"></v-pagination>
			</div>
			<!--end: Items-->
		</div>
		<!--end: Card Body-->
	</div>
	<!--end: Card-->
	<!--end: List Widget 9-->
</template>
<style scoped lang="scss">
	/*.max-height{
        max-height: 260px;
        overflow-y: auto;
        margin-bottom: 20px;
    }*/
	.timeline.timeline-5:before {
		background-color: unset;
	}
	
	.text-start {
		color: white;
	}

	.card-header .searchbox {
		display: flex;
		flex-direction: row;
		align-items: center;
		height: 80px;

		.path-search {
			display: flex;
			flex-direction: row;
			align-items: center;

			.title {
				width: 120px;
				color: white;
			}
		}

		.ip-search {
			margin-left: 30px;
			display: flex;
			flex-direction: row;
			align-items: center;

			.title {
				width: 80px;
				color: white;
			}
		}
	}
</style>
<script>
	import Dropdown2 from "@/view/content/dropdown/Dropdown2.vue";
	import {
		mapGetters
	} from "vuex";
	import ApiService from "@/core/services/api.service";
	import AUTH from "@/core/services/store/auth.module";
	import {
		LOGIN,
		LOGOUT
	} from "@/core/services/store/auth.module";

	export default {
		name: "widget-9",
		data() {
			return {
				list: [],
				length: 3,
				circle: false,
				disabled: false,
				limit: 20,
				page: 1,
				localeConfig: {
					"zh-cn": {
						dow: 0,
						dir: "ltr",
						lang: {
							label: "ZH-CN",
							submit: "确定",
							cancel: "取消",
							now: "现在"
						}
					}
				},
				start_date: "",
				end_date: "",
				tip: false,
				headers: [{
						text: "序号",
						class: "text-white",
						cellClass: "td-item",
						align: "start",
						sortable: false,
						value: "no",
					},
					{
						text: "IP",
						class: "text-white",
						value: "ip"
					},
					{
						text: "请求路径",
						class: "text-white",
						value: "path"
					},
					{
						text: "说明",
						class: "text-white",
						value: "board"
					},
					{
						text: "请求时间",
						class: "text-white",
						value: "time"
					},
					{
						text: "请求耗时",
						class: "text-white",
						value: "time_lang"
					},
					{
						text: "请求用户",
						class: "text-white",
						value: "users"
					},
					{
						text: "操作",
						class: "text-white",
						value: "actions",
						sortable: false,
					}
				]
			};
		},
		components: {
			Dropdown2
		},
		created() {
			var data = new Date();
			var month =
				data.getMonth() < 9 ? "0" + (data.getMonth() + 1) : data.getMonth() + 1;
			var date = data.getDate() <= 9 ? "0" + data.getDate() : data.getDate();
			var hour = data.getHours();
			var minute = data.getMinutes();
			var second = data.getSeconds();
			var days = 7;
			var newDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
			var endmonth =
				newDate.getMonth() < 9 ?
				"0" + (newDate.getMonth() + 1) :
				newDate.getMonth() + 1;
			var enddate =
				newDate.getDate() <= 9 ? "0" + newDate.getDate() : newDate.getDate();
			var enddates =
				data.getFullYear() +
				"/" +
				month +
				"/" +
				date +
				"T" +
				hour +
				":" +
				minute +
				":" +
				second;
			var startdate =
				newDate.getFullYear() +
				"/" +
				endmonth +
				"/" +
				enddate +
				"T" +
				hour +
				":" +
				minute +
				":" +
				second;
			this.start_date = startdate;
			this.end_date = enddates;
		},
		mounted() {
			this.operation();
		},
		methods: {
			operation() {
				ApiService.post(AUTH.local_url + "/operation/list", {
					limit: this.limit,
					page: this.page,
					start_date: this.start_date,
					end_date: this.end_date
				}).then(({
					data
				}) => {
					if (data.code == 200) {
						if (data.data.data.length > 0) {
							this.tip = false;

							var mylist = [];

							for (var i = 0; i < data.data.data.length; i++) {
								var item = data.data.data[i];
								var detailed = JSON.parse(item.detailed);
								mylist.push({
									no: i + 1,
									ip: detailed.ip,
									path: detailed.path,
									board: '仪表盘',
									time: item.created_at,
									time_lang: 10,
									users: 20
								});
							}

							this.list = mylist;
						} else {
							this.tip = true;
						}
						this.length = data.data.last_page;
					} else if (data.code == 401) {
						this.$store.dispatch(LOGOUT).then(() =>
							this.$router.push({
								name: "login"
							})
						);
					} else {}
				});
			},
			pageChange() {
				this.operation();
			},
			clickItem(item) {

			},
		},
		computed: {
			...mapGetters(["layoutConfig"])
		}
	};
</script>
