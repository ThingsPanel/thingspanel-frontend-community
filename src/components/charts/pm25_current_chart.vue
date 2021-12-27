<template>
	<div class="x-pm25">
		<div class="number">{{number != ''? number:"0"}} ug/m3</div>
	</div>
</template>
<script>
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
				direction: 'vertical',
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
</style>
