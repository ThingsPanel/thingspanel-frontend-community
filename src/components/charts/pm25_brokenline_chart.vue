<template>
  <div class="x-pm25">
    <div
      :id="'chart_' + id"
      class="chart"
      style="width: 100%; min-height: 200px"
    ></div>
  </div>
</template>
<script>
import echarts from "echarts";

export default {
  name: "pm25_brokenline_chart",
  props: {
    id: {
      type: Number,
      default: 0,
    },
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
      chart_type: "pm25_brokenline_chart",
      options10: {
        grid: {
          top: 10,
        },
        xAxis: {
          type: "category",
          data: [],
          axisLabel: {},
          axisLine: {
            lineStyle: {
              color: "#cccccc",
            },
          },
        },
        yAxis: {
          type: "value",
          axisLine: {
            lineStyle: {
              color: "#cccccc",
            },
          },
        },
        series: [],
      },
      level: 0,
      course_id: "",
      chapter_id: "",
      idNameMapping: [],

      maxLevel: 2,
      hasAxis: true,

      chart: null,
      // render direction
      direction: "vertical",
      /**
       * init options for vue-echarts
       * switch render mode between canvas and svg
       */
      initOptions: {
        renderer: "canvas",
      },
      xColumn: {},
      yColumns: [],
      categories: [],
      seriesData: [],
      latest: {},
      fields: [],
      pm10datas: [],
      pm25datas: [],
      pm100datas: [],
      xdata: [],
      timer: null,
    };
  },
  computed: {
    itemStyle() {
      const defaultItemStyle = {
        normal: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              {
                offset: 0,
                color: this.colorStart, // 0%
              },
              {
                offset: 1,
                color: this.colorEnd, // 100%
              },
            ],
          },
        },
      };
      if (this.chart_type === "x_bar") {
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
          if (val["fields"]) {
            _this.latest = val["latest"];
            _this.fields = val["fields"];
            _this.initChart();
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
  mounted() {},
  methods: {
    /**
     * init chart
     */
    initChart() {
      let _this = this;

      if (this.fields.length <= 0) {
        return;
      }

      this.chart = echarts.init(document.getElementById("chart_" + this.id));
      for (let i = 0; i < this.fields.length; i++) {
        let item = this.fields[i];
        if (_this.id == "3") {
          let datas = this.pm25datas;
          datas.push(item["pm25"]);
          this.pm25datas = datas;
        } else if (_this.id == "7") {
          let datas = this.pm100datas;
          datas.push(item["pm100"]);
          this.pm100datas = datas;
        } else if (_this.id == "5") {
          let datas = this.pm10datas;
          datas.push(item["pm10"]);
          this.pm10datas = datas;
        }
        var date = item["time"];
        date = date.substring(0, 19);
        date = date.replace(/-/g, "/");
        var timestamp = new Date(date).getTime();
        let d = new Date(timestamp);
        this.xdata.push(d.getHours() + ":" + d.getMinutes());
      }

      let pm10data = {};

      if (_this.id == "3") {
        pm10data = {
          type: "line",
          lineStyle: {
            color: "#5aa7ff",
          },
          data: this.pm25datas,
        };
      } else if (_this.id == "7") {
        pm10data = {
          type: "line",
          lineStyle: {
            color: "#5aa7ff",
          },
          data: this.pm100datas,
        };
      } else if (_this.id == "5") {
        pm10data = {
          type: "line",
          lineStyle: {
            color: "#5aa7ff",
          },
          data: this.pm10datas,
        };
      }
      let options10 = this.options10;
      options10.xAxis.data = this.xdata;
      options10.series[0] = pm10data;
      this.options10 = options10;

      _this.chart.clear();
      _this.chart.setOption(_this.options10);

      window.addEventListener("resize", () => {
        _this.chart.resize();
      });
    },
    handleChartClick(param) {
      console.log(param);
    },

    /**
     * echarts instance init event
     * @param {object} chart echartsInstance
     */
    chartInit(chart) {
      this.chart = chart;
      // must resize chart in nextTick
      this.$nextTick(() => {
        this.resizeChart();
      });
    },

    /**
     * emit chart component init event
     */
    emitInit() {
      if (this.$refs.chart) {
        this.chart = this.$refs.chart.chart;
        this.$emit("init", {
          chart: this.chart,
          chartData: this.apiData,
        });
      }
    },

    /**
     * resize chart
     */
    resizeChart() {
      /* eslint-disable no-unused-expressions */
      this.chart && this.chart.resize();
    },

    /**
     * convert to echarts option format
     */
    convertData() {
      const data = this.apiData;
      this.yColumns = [];
      this.categories = [];
      this.seriesData = [];
      if (this.apiData) {
        this.apiData.columns.forEach((item) => {
          if (item.type === "x") {
            this.xColumn = item;
          }
          if (item.type === "y") {
            this.yColumns.push(item);
          }
        });
        this.yColumns.forEach((yColumn) => {
          const series = [];
          data.rows.forEach((row) => {
            if (this.xColumn && this.xColumn.field) {
              if (this.categories.length < data.rows.length) {
                this.categories.push(row[this.xColumn.field]);
              }
            }
            if (yColumn && yColumn.field) {
              series.push({
                ...{
                  name: row[this.xColumn.field],
                  value: row[yColumn.field],
                },
                ...row,
              });
            }
          });
          this.seriesData.push(series);
        });
      }
    },

    /**
     * create series array suit for echarts options
     * @param {string} type chart type
     * @param {string} name chart title
     * @param {Array} data chart data
     * @param {object} itemStyle chart item render style
     */
    createEchartsSeriesItem(type, name, data, itemStyle) {
      const seriesItem = {
        name,
        data,
        itemStyle,
        smooth: true,
      };
      let extraOptions;

      extraOptions = {
        type: "line",
      };
      return Object.assign({}, seriesItem, extraOptions);
    },
  },

  async mounted() {
    this.emitInit();
  },
};
</script>

<style lang="scss" scoped>
.x-pm25 {
  .current-con {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;

    .item {
      width: 30%;
      text-align: center;
      margin: 0 10px;

      .title {
        font-size: 24px;
      }
    }
  }
}

.echarts {
  width: 100%;
  height: 100%;
}
</style>
