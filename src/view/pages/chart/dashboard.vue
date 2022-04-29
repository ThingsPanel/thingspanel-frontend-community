<template>
	<div class="dashboard" ref="dashboard" v-loading.fullscreen="false" element-loading-text="Loading..."
		data-app="true">
		<grid-layout :layout="slices" :col-num="gridColNum" :row-height="gridRowHeight" :is-draggable="gridDraggable"
			:is-resizable="gridResizable" :vertical-compact="true" :margin="gridMargin" :use-css-transforms="true"
			:autoSize="true">
			<!-- :h.sync="item.h" -->
			<grid-item v-for="(item, index) in slices" :key="index" :x.sync="item.x" :y.sync="item.y" :w.sync="item.w"
				:h.sync="item.h" :i="item.i" :ref="item.i"
				:style="gridItemBackground(item.chart_type, colorStart, colorEnd, bgcolor)"
				dragIgnoreFrom=".echarts,.x-number,.card-title,.right-buttons" @resized="resizedEvent"
				@moved="movedEvent" class="chart-item">
				<Slice @expand="handleFocus" :item="item" :colorStart="colorStart" :colorEnd="colorEnd"
					:socketData="socketData" />
				<!-- <component class="test-main" :is="compName"></component> -->
			</grid-item>
		</grid-layout>
		<!-- focus mode mask -->
		<div class="grip-modal" v-show="showModal"></div>
	</div>
</template>

<script>
	import {
		GridLayout,
		GridItem
	} from "vue-grid-layout";
	import Slice from "@/components/common/slice";

	import AUTH from "@/core/services/store/auth.module";
	import ApiService from "@/core/services/api.service";
	import {
		REFRESH
	} from "@/core/services/store/auth.module";
	import Utils from "@/utils/util.js";
	import websocket from "@/utils/websocket.js";
	import pako from "pako";
	import {
		Base64
	} from "js-base64";
	import Vue from "vue";

	var _window;

	export default {
		name: "Dashboard",
		props: {
			colorStart: {
				type: String,
				default: "#7956EC",
			},
			colorEnd: {
				type: String,
				default: "#3CECCF",
			},
			busid: {
				type: String,
			},
			chart_id: {
				type: String,
			},
			assest_id: {
				type: String,
			},
			proid: {
				type: String,
			},
			bgcolor: {
				type: String,
				default: "#1a234f",
			},
			start_time: {
				type: String,
				default: 0,
			},
			end_time: {
				type: String,
				default: 0,
			},
			latest_time: {
				type: Number,
				default: 0,
			},
			role: {
				type: Number,
				default: 0,
			},
		},
		data() {
			return {
				dialog: false,
				loading: false,
				showSavePopup: false,
				loadTime: 0,
				showModal: false,
				gridDraggable: true,
				gridResizable: true,
				gridColNum: 36,
				gridRowHeight: 10,
				gridMargin: [30, 30, 30, 30],
				cachePosition: {
					x: 0,
					y: 0,
					w: 0,
					h: 0,
				},

				/**
				 * https://github.com/yugasun/vue-grid-layout/blob/a7d39f28425cee6a6176388daea40e8c8d9c4826/src/GridLayout.vue#L206-L208
				 */
				layoutUpdating: false,
				slices: [], // charts modules
				socketData: null,
				charts: [],
				compName: "",
				plugins: [],
			};
		},
		watch: {
			chart_id() {
				this.loadCharts("chart_id");
			},
			assest_id() {
				this.loadCharts("assest_id");
			},
		},
		components: {
			GridLayout,
			GridItem,
			Slice,
		},
		mounted() {
			_window = window;
			this.loadCharts("mounted");

			let _this = this;
			//start websocket
			websocket.connect();
			websocket.onmessage(function(evt) {
				console.log(evt);
				//解压数据
				try {
					_this.socketData = evt.data;
				} catch (err) {
					console.log(err);
				}
				_this.setHeight();
			});

			console.log(window.screen.width);
			this.setHeight();
		},
		destroyed: function() {
			websocket.close();
		},
		methods: {
			loadCharts(from) {
				let _that = this;
				ApiService.post(AUTH.local_url + "/dashboard/pluginList", {}).then(
					({
						data
					}) => {
						console.log("获取插件数据");
						console.log(data);
						if (data.code == 200) {
							_that.charts = data.data;
							_that.loadScripts();
						}
					}
				);
			},
			loadScripts() {
				let _that = this;
				let chartCount = 0;

				for (let i = 0; i < this.charts.length; i++) {
					let chart = this.charts[i];

					let script = document.createElement("script");
					script.type = "text/javascript";
					script.src = (process.env.VUE_APP_BASE_URL ||
    document.location.protocol + "//" + document.domain +":9999/").slice(0,(process.env.VUE_APP_BASE_URL ||
    document.location.protocol + "//" + document.domain +":9999/").length-1) + chart.url;
					script.onload = () => {
						Vue.component(chart.component, _window[chart.chart_type].default);

						chartCount += 1;
						if (_that.charts.length == chartCount) {
							console.log("---loadScripts2---");
							_that.getDashboard(this.chart_id, this.assest_id);
						}
					};
					document.body.appendChild(script);
				}
			},

			getTime() {
				var data = new Date();
				var month =
					data.getMonth() < 9 ? "0" + (data.getMonth() + 1) : data.getMonth() + 1;
				var date = data.getDate() <= 9 ? "0" + data.getDate() : data.getDate();
				var hour = data.getHours() <= 9 ? "0" + data.getHours() : data.getHours();
				var minute =
					data.getMinutes() <= 9 ? "0" + data.getMinutes() : data.getMinutes();
				var second =
					data.getSeconds() <= 9 ? "0" + data.getSeconds() : data.getSeconds();
				return data.getFullYear() + month + date + hour + minute + second;
			},

			// 动态设置响应式高度
			setHeight() {
				if (window.screen.width <= 768) {
					this.gridDraggable = false;
					this.gridResizable = false;
					this.$nextTick(() => {
						setTimeout(() => {
							let el = document.getElementsByClassName("slice-wrapper");
							let grid = document.getElementsByClassName("chart-item");
							for (var i = 0; i < grid.length; i++) {
								var h = Number(el[i].clientHeight) + Number(40);
								grid[i].style.height = h + "px";
							}
						}, 1000);
					});
					// console.log(document.getElementsByClassName('slice-wrapper')[0].offsetHeight)
				}
			},
			// create gradient background
			gridItemBackground(type, start, stop, bgcolor) {
				/*console.log(start);
				          console.log(bgcolor);*/
				return {
					background: `${bgcolor}`,
				};
			},

			/** *
			 * Get dashboard modules
			 */
			async getDashboard(chart_id, assest_id) {
				this.setHeight();
				this.loading = true;
				this.layoutUpdating = true;

				let time = this.getTime();
				if (this.loadTime == undefined || time - this.loadTime < 5) {
					return;
				}

				console.log("---this.loadTime---", this.loadTime);

				this.loadTime = time;

				// 禁止普通用户拖动
				let _that = this;
				if (this.role == 1) {
					this.gridDraggable = false;
				}
				try {
					console.log("获取dashboard数据");
					ApiService.post(AUTH.local_url + "/dashboard/dashboard", {
						chart_id: chart_id,
						asset_id: assest_id,
					}).then(({
						data
					}) => {
						console.log("获取总数据");
						console.log(data);
						if (data.code == 200) {
							for (var i = 0; i < data.data.length; i++) {
								/*data.data[i].aid = proid;
								                      data.data[i].bid = busid;*/
								data.data[i].startTs = new Date(this.start_time).getTime();
								data.data[i].endTs = new Date(this.end_time).getTime();
								data.data[i].latestTime = this.latest_time; //minutes
								data.data[i].w = Number(data.data[i].w);
								data.data[i].h = Number(data.data[i].h);
							}
							_that.slices = data.data;
							console.log("_that.slices", _that.slices);
							_that.loading = false;
						}
					});
				} catch (e) {
					console.log(e);
					this.loading = false;
				}
			},

			/**
			 * Calculate popup slice position
			 */
			calPopPosition(expandTarget) {
				// set popup number of columns
				const popW = 30;
				// set popup number of rows
				const popH = (popW * 9) / 16;
				// calculate real width for every column
				const colWidth =
					(expandTarget.$parent.width -
						this.gridMargin[0] * (this.gridColNum + 1)) /
					this.gridColNum;
				// calculate real width for popup slice
				const width = Math.round(
					colWidth * popW + Math.max(0, popW - 1) * this.gridMargin[0]
				);
				// calculate real height for popup slice
				const height = Math.round(
					this.gridRowHeight * popH + Math.max(0, popH - 1) * this.gridMargin[1]
				);

				const winH = window.innerHeight;
				// calculate popup slice top
				const top =
					Math.round((winH - height) / 2) -
					this.$refs.dashboard.getBoundingClientRect().top;

				// height: Math.round(this.rowHeight * h + Math.max(0, h - 1) * this.margin[1])
				// top: Math.round(this.rowHeight * y + (y + 1) * this.margin[1])
				const popY =
					(top - this.gridMargin[1]) / (this.gridRowHeight + this.gridMargin[1]);
				const popX = (this.gridColNum - popW) / 2;
				return {
					popX,
					popY,
					popW,
					popH,
					width,
					height,
				};
			},
			/**
			 * cache popup slice position
			 */
			storePosition(item) {
				this.cachePosition = {
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
					width: item.width,
					height: item.height,
				};
			},
			/**
			 * restore popup slice position
			 */
			restorePosition(item) {
				item.width = this.cachePosition.width;
				item.height = this.cachePosition.height;
				item.x = this.cachePosition.x;
				item.y = this.cachePosition.y;
				item.w = this.cachePosition.w;
				item.h = this.cachePosition.h;
				return item;
			},

			/**
			 * go into focus mode
			 */
			handleFocus({
				expand,
				targetRef
			}) {
				const expandTarget = this.$refs[targetRef][0];
				if (expand) {
					this.gridDraggable = false;
					this.gridResizable = false;
					this.$nextTick(() => {
						expandTarget.$el.classList.add("popup");
						this.slices = this.slices.map((item) => {
							if (item.i === targetRef) {
								// 1. 记录当前位置信息
								this.storePosition(item);
								// 2. 计算专注模式位置参数
								const popPosition = this.calPopPosition(expandTarget);
								item.x = popPosition.popX;
								item.y = popPosition.popY;
								item.w = popPosition.popW;
								item.h = popPosition.popH;
								item.width = popPosition.width;
								item.height = popPosition.height;
							}
							return item;
						});
						this.showModal = true;
					});
				} else {
					this.gridDraggable = true;
					this.gridResizable = true;
					this.$nextTick(() => {
						this.slices = this.slices.map((item) => {
							if (item.i === targetRef) {
								item = this.restorePosition(item);
							}
							return item;
						});
						this.showModal = false;
						setTimeout(() => {
							expandTarget.$el.classList.remove("popup");
						}, 1000);
					});
				}
			},

			/**
			 *
			 * @param i the item id/index
			 * @param H height in grid rows
			 * @param W width in grid columns
			 * @param HPx height in pixels
			 * @param WPx width in pixels
			 *
			 */
			initEvent(i, H, W, HPx, WPx) {
				this.slices = this.slices.map((item) => {
					if (item.i === i) {
						item.width = WPx;
						item.height = HPx;
					}
					return item;
				});
			},

			/**
			 * grid resized event
			 * @param i the item id/index
			 * @param newH new height in grid rows
			 * @param newW new width in grid columns
			 * @param newHPx new height in pixels
			 * @param newWPx new width in pixels
			 *
			 */
			resizedEvent(i, newH, newW, newHPx, newWPx) {
				console.log("resizedEvent");
				this.slices = this.slices.map((item) => {
					if (item.i === i) {
						item.width = newWPx;
						item.height = newHPx;
					}
					var id = item.id;
					var config =
						'{"x":' +
						item.x +
						',"y":' +
						item.y +
						',"w":' +
						item.w +
						',"h":' +
						item.h +
						',"width":' +
						item.width +
						',"height":' +
						item.height +
						"}";

					this.dashboard_copy(id, config);
					return item;
				});
				this.showSavePopup = true;
				// this.getDashboard(this.busid,this.proid);
			},

			dashboard_copy(id, config) {
				console.log("dashboard_copy.vue");
				ApiService.post(AUTH.local_url + "/dashboard/updateDashboard", {
					id: id,
					config: config,
				}).then(({
					data
				}) => {
					console.log(data);
					if (data.code == 200) {
						console.log("成功");
					} else if (data.code == 401) {
						this.$store.dispatch(REFRESH).then(() => {});
					} else {}
				});
			},

			/**
			 * grid moved event
			 * @param i the item id/index
			 * @param newX new x in grid rows
			 * @param newY new y in grid columns
			 *
			 */
			movedEvent(i, newX, newY) {
				console.log('--movedEvent---');

				this.slices = this.slices.map((item) => {
					if (item.i === i) {
						item.x = newX;
						item.y = newY;
					}
					var id = item.id;
					var config =
						'{"x":' +
						item.x +
						',"y":' +
						item.y +
						',"w":' +
						item.w +
						',"h":' +
						item.h +
						',"width":' +
						item.width +
						',"height":' +
						item.height +
						"}";

					this.dashboard_copy(id, config);
					return item;
				});
				this.showSavePopup = true;
				// this.getDashboard(this.busid,this.proid);
			},
		},
		created() {
			console.log("获取业务id");
			console.log(this.busid);
		},
	};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
	.dashboard {
		width: 100%;
		// height: 100%;
		min-height: 800px;
	}

	.grid {
		position: relative;
	}

	.grip-modal {
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		position: fixed;
		z-index: 50;
		background-color: rgba(0, 0, 0, 0.5);
	}

	.chart-item {
		z-index: 5;
		display: block;
		border-radius: 6px;
		background-color: #fff;
		color: black;
		box-shadow: 0 0 40px rgba(226, 226, 226, 0.5);
		// overflow: hidden;
		padding: 15px;
		box-sizing: border-box;

		&.cssTransforms {
			transition: all 200ms ease;
			transition-property: box-shadow, transform;
		}

		&:hover {
			box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
		}

		&.popup {
			position: absolute !important;
			z-index: 100;
		}
	}

	@media (max-width: 768px) {
		.chart-item {
			/*width: 92% !important;*/
			transform: unset !important;
			/*left: 4% !important;*/
			top: 10px;
			width: 100% !important;
			left: 0 !important;
		}

		.chart-item.cssTransforms {
			position: relative !important;
			margin-bottom: 10px !important;
		}

		.slice-wrapper {
			height: unset !important;
		}

		.dashboard {
			margin-top: 30px;
		}
	}

	.container-fluid {
		padding: 0 !important;
	}

</style>
