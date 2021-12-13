<template>
   <echarts
      v-loading="loading"
      element-loading-text="Loading..."
      :theme="theme"
      ref="chart"
      class="chart"
      @click="handleChartClick"
      @init="chartInit"
      :auto-resize="true"
      :options="options">
    </echarts>
</template>
<script>
// import ChartMixin from '@/components/mixins/chart-mixin';
import { cutStr } from '@/utils/tool';
// import { LinearGradient } from 'echarts/lib/util/graphic'

export default {
  name: 'XLineArea',
  // mixins: [ChartMixin],
  props: {
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
      default() {
        return {
          columns: [],
          rows: [],
        };
      },
    },
    title: {
      type: String,
      default: '',
    },
    colorStart: {
      type: String,
      default: '#7956EC',
    },
    colorEnd: {
      type: String,
      default: '#3CECCF',
    },
  },
  data() {
    return {
      chart_type: 'x_line_area',
      options: {
        title: {
          show: false,
          text: this.title,
          textStyle: {
            align: 'center',
            verticalAlign: 'middle',
          },
          top: 10,
          left: '10',
        },
        legend: {
          show: true,
          top: 10,
          // data: [],
        },
        tooltip: {
          trigger: 'item',
          axisPointer: {
            type: 'line',
          },
          confine: true,
          // backgroundColor: 'rgba(4,29,49,0.6)'
        },
        grid: {
          show: true,
          top: 40,
          left: 20,
          right: 20,
          bottom: 10,
          containLabel: true,
        },
        xAxis: [
          {
            type: 'category',
            axisLine: {
              lineStyle: {
                color: '#9FA9BB',
              },
            },
            data: [],
            axisLabel: {
              rotate: 75,
              showMaxLabel: true,
              /*formatter(params, index) {
                return cutStr(params, 5);
              },*/
            },
          },
        ],
        yAxis: [
          {
            type: 'value',
            axisLine: {
              lineStyle: {
                color: '#9FA9BB',
              },
            },
          },
        ],
        series: [],
      },
       /**
       * whether has axis,
       * for pie,relation chart need set false
       */
      hasAxis: true,

      chart: null,
      // render direction
      direction: 'vertical',
      /**
       * init options for vue-echarts
       * switch render mode between canvas and svg
       */
      initOptions: { renderer: 'canvas' },
      xColumn: {},
      yColumns: [],
      categories: [],
      seriesData: [],
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
              offset: 0, color: this.colorStart, // 0%
            }, {
              offset: 1, color: this.colorEnd, // 100%
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
            _this.initChart();
          }
      },
    },
    colorStart() {
      this.initChart();
    },
    colorEnd() {
      this.initChart();
    },
    legend(val, oldVal) {
      console.log('legend');
      console.log(val);
      this.chart.setOption({
        legend: {
          show: val,
        },
      });
    },
  },
  methods: {
    handleChartClick(param) {
      console.log(param);
      console.log(1111);
    },

    /**
     * echarts instance init event
     * @param {object} chart echartsInstance
     */
    chartInit(chart) {
      console.log('chartInit');
      console.log(chart);
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
      console.log('emitInit');
      console.log(this.$refs.chart.chart);
      if(this.$refs.chart){
        this.chart = this.$refs.chart.chart;
        console.log(this.apiData);
        console.log(this.chart);
        this.$emit('init', {
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
      console.log('convertData');
      console.log('2222')
      console.log(this.apiData);
      if(this.apiData){
      this.apiData.columns.forEach((item) => {
        console.log(item);
        if (item.type === 'x') {
          this.xColumn = item;
        }
        if (item.type === 'y') {
          this.yColumns.push(item);
        }
      });
      console.log(this.yColumns);
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
        console.log(this.seriesData);
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
          type: 'line',
          areaStyle: {
            normal: {
              opacity: 0.3,
            },
          },
        };
      return Object.assign({}, seriesItem, extraOptions);
    },

    /**
     * init chart
     */
    initChart() {
      console.log('initChart');
      this.convertData();
      this.options.series = [];
      let itemStyle;
      if (this.hasAxis) {
        if (this.direction === 'horizontal') {
          this.options.yAxis[0].data = this.categories;
        } else {
          this.options.xAxis[0].data = this.categories;
        }
        // set gradient for single measure
        itemStyle = this.seriesData.length > 1 ? {} : this.itemStyle;
      } else {
        itemStyle = {};
      }
      this.seriesData.forEach((data, index) => {
        const series = this.createEchartsSeriesItem(
          this.chart_type,
          this.yColumns[index].name,
          data,
          itemStyle,
        );
        this.options.series.push(series);
      });
      console.log(this.options.series);
      console.log(this.chart);
      this.chart.setOption({
        series:this.options.series
      })
    },

  },

  async mounted() {
    this.emitInit();

  },
};
</script>
<style lang="scss" scoped>

</style>
