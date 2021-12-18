<template>
	<div class="x-pm25">
		<div class="number">{{number != ''? number:"0"}} ug/m3</div>
	</div>
</template>
<script>
	import echarts from 'echarts';

	export default {
		name: "pm25_current_chart",
		props: {
			id: '',
			loading: {
				type: Boolean,
				default: true,
			},
			legend: {
				type: Boolean,
				default: true,
			},
			apiData: {
				type: Object,
			},
			title: {
				type: String,
				default: "",
			},
			colorStart: {
				type: String,
				default: "#7956EC",
			},
			colorEnd: {
				type: String,
				default: "#3CECCF",
			},
		},
		data() {
			return {
				chart_type: "pm25_current_chart",
				level: 0,
				course_id: '',
				chapter_id: '',
				idNameMapping: [],

				maxLevel: 2,
				hasAxis: true,

				chart: null,
				// render direction
				direction: 'vertical',
				/**
				 * init options for vue-echarts
				 * switch render mode between canvas and svg
				 */
				initOptions: {
					renderer: 'canvas'
				},
				xColumn: {},
				yColumns: [],
				categories: [],
				seriesData: [],
				latest: {},
				fields: [],
				number: ""
			};
		},
		computed: {
			itemStyle() {
				const defaultItemStyle = {
					normal: {
						color: {
							type: 'linear',
							x: 0,
							y: 0,
							x2: 1,
							y2: 0,
							colorStops: [{
								offset: 0,
								color: this.colorStart, // 0%
							}, {
								offset: 1,
								color: this.colorEnd, // 100%
							}],
						},
					},
				};
				if (this.chart_type === 'x_bar') {
					defaultItemStyle.normal.color.x2 = 0;
					defaultItemStyle.normal.color.y2 = 1;
				}
				return defaultItemStyle;
			},
		},
		watch: {
			apiData: {
				// deep: true,
				immediate: true,
				handler(val, oldVal) {
					var _this = this;
					if (!_this.loading) {
						if (val['fields']) {
							_this.latest = val["latest"];
							_this.fields = val["fields"];
							
							if (_this.id == '2') {
								_this.number = _this.latest['pm25']
							}
							else if (_this.id == '6') {
								_this.number = _this.latest['pm100']
							}
							else if (_this.id == '4') {
								_this.number = _this.latest['pm10']
								
							}
						}
					}
				},
			},
			colorStart() {},
			colorEnd() {},
			legend(val, oldVal) {
				this.chart.setOption({
					legend: {
						show: val,
					},
				});
			},
		},
		methods: {
		},
	};
</script>

<style lang="scss" scoped>
	.x-pm25 {
		.number {
			font-size: 30px;
			color: white;
			text-align: center;
			margin: 10px;
		}
	}

	.echarts {
		width: 100%;
		height: 100%;
	}
</style>
