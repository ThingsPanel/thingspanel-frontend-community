<template>
  <!-- 自定义对话框 -->
  <el-dialog :title="$t('PLUGIN.CUSTOM_DASHBOARD.TITLE')" width="1000px" :class="dark?'dark-dialog':''"
             :close-on-click-modal="false" :visible.sync="dialogVisible" :append-to-body="true"
             @closed="closed">

    <el-row style="height: 500px;" :gutter="20">
      <!-- 左侧：option代码 -->
      <el-col :span="14">
        <el-tabs v-model="leftActive" type="card">
          <el-tab-pane :label="$t('PLUGIN.CUSTOM_DASHBOARD.TAB_PANE_LABEL1')" name="option">
            <div class="option-pane-select-div">
              {{ $t('PLUGIN.CUSTOM_DASHBOARD.TXT') }}
              <el-select v-model="seriesType" :placeholder="$t('PLUGIN.CUSTOM_DASHBOARD.PLACEHOLDER1')" @change="changeSeriesType">
                <el-option v-for="(item, index) in seriesOptions" :key="index" :label="item.label" :value="item.value"/>

              </el-select>
            </div>
            <el-input style="height: 450px;overflow-y: auto"
                      type="textarea" :placeholder="$t('PLUGIN.CUSTOM_DASHBOARD.PLACEHOLDER2')"
                      :autosize="{ minRows: 20, maxRows: 20}" v-model="jsonOptionText"
                      @input="jsonOptionInput">
            </el-input>
          </el-tab-pane>

          <!-- 模拟数据 -->
          <el-tab-pane :label="$t('PLUGIN.CUSTOM_DASHBOARD.TAB_PANE_LABEL2')" name="random">
            <div class="random-pane-div">
              <el-form :inline="true" style="display: flex;justify-content: space-between">
                <el-form-item >
                  <el-checkbox v-model="startRandom" @change="changeRandomState">{{ $t('PLUGIN.CUSTOM_DASHBOARD.CHECKBOX') }}</el-checkbox>
                </el-form-item>
                <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE1')">
                  <el-input-number v-model="customInterval" :min="0.5" :max="10" :step="0.5"
                                   @change="setRandomData" >
                  </el-input-number>
                </el-form-item>
              </el-form>


              <!-- 根据图表显示tab -->
<!--              <el-divider content-position="left"></el-divider>-->
              <el-tabs v-model="randomTabsValue" type="card">
                <el-tab-pane v-for="item in randomTabs" :key="item.name" :label="item.title" :name="item.name">
                  <el-input style="height: 250px;overflow-y: auto"
                            type="textarea" :placeholder="$t('PLUGIN.CUSTOM_DASHBOARD.PLACEHOLDER3')"
                            :autosize="{ minRows: 10, maxRows: 10}" v-model="item.content"
                            @input="randomInput"></el-input>
                </el-tab-pane>
              </el-tabs>

            </div>

          </el-tab-pane>

          <el-tab-pane class="ui-tab-pane" :label="$t('PLUGIN.CUSTOM_DASHBOARD.TAB_PANE_LABEL3')" name="ui">
            <el-tabs v-model="styleTabsValue">
              <el-tab-pane v-for="(item, index) in styleTabs" :key="index" :label="item.title" :name="item.name">
                <el-form class="ui-pane-form" label-position="left" :inline="false" label-width="250px">

                  <!-- 当前值文本大小 30 -->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE2')">
                    <el-input-number v-model="chartStyle[index].detail.fontSize" @change="handleChangeStyle"></el-input-number>
                  </el-form-item>
                  <!-- 当前值文本颜色 #000 -->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE3')">
                    <el-color-picker v-model="chartStyle[index].detail.color" @change="handleChangeStyle"></el-color-picker>
                  </el-form-item>
                  <!-- 当前值文本后缀 "" -->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE4')">
                    <el-input v-model="currentValueEnds" @change="handleChangeStyle"></el-input>
                  </el-form-item>

                  <!-- 当前值的纵轴位置 40 -->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE5')">
                    <el-input-number v-model="offsetCenterY" @change="handleChangeStyle"></el-input-number>
                  </el-form-item>

                  <!-- pointer.show true-->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE6')">
                    <el-switch v-model="chartStyle[index].pointer.show" @change="handleChangeStyle"></el-switch>
                  </el-form-item>

                  <!-- itemStyle.color -->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE7')">
                    <el-color-picker v-model="chartStyle[index].itemStyle.color" @change="handleChangeStyle"></el-color-picker>
                  </el-form-item>

                  <!-- progress.show false -->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE8')">
                    <el-switch v-model="chartStyle[index].progress.show" @change="handleChangeStyle"></el-switch>
                  </el-form-item>

                  <!-- progress.width 10-->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE9')">
                    <el-input-number v-model="chartStyle[index].progress.width"  @change="handleChangeStyle"></el-input-number>
                  </el-form-item>

                  <!-- axisLine.show true-->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE10')">
                    <el-switch v-model="chartStyle[index].axisLine.show" @change="handleChangeStyle"></el-switch>
                  </el-form-item>

                  <!-- axisLine.lineStyle.width 10-->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE11')">
                    <el-input-number v-model="chartStyle[index].axisLine.lineStyle.width" @change="handleChangeStyle"></el-input-number>
                  </el-form-item>


                  <!-- axisLabel.show true-->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE12')">
                    <el-switch v-model="chartStyle[index].axisLabel.show" @change="handleChangeStyle"></el-switch>
                  </el-form-item>

                  <!-- axisLabel.color #000-->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE13')">
                    <el-color-picker v-model="chartStyle[index].axisLabel.color" @change="handleChangeStyle"></el-color-picker>
                  </el-form-item>

                  <!-- axisLabel.fontSize 12-->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE14')">
                    <el-input-number v-model="chartStyle[index].axisLabel.fontSize" @change="handleChangeStyle"></el-input-number>
                  </el-form-item>

                  <!-- axisLabel.distance 15-->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE15')">
                    <el-input-number v-model="chartStyle[index].axisLabel.distance" @change="handleChangeStyle"></el-input-number>
                  </el-form-item>

                  <!-- splitLine.show true-->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE16')">
                    <el-switch v-model="chartStyle[index].splitLine.show" @change="handleChangeStyle"></el-switch>
                  </el-form-item>

                  <!-- splitLine.length 10 -->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE17')">
                    <el-input-number v-model="chartStyle[index].splitLine.length" @change="handleChangeStyle"></el-input-number>
                  </el-form-item>

                  <!-- axisTick.show true -->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE18')">
                    <el-switch v-model="chartStyle[index].axisTick.show" @change="handleChangeStyle"></el-switch>
                  </el-form-item>

                  <!-- anchor.show false-->
                  <el-form-item :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE19')">
                    <el-switch v-model="chartStyle[index].anchor.show" @change="handleChangeStyle"></el-switch>
                  </el-form-item>

                </el-form>
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>
        </el-tabs>
      </el-col>

      <!-- 右侧：图表预览 -->
      <el-col :span="10">
        <el-tabs v-model="rightActive" type="card">
          <el-tab-pane :label="$t('PLUGIN.CUSTOM_DASHBOARD.LABLE20')" name="preview" >
            <div style="width: 280px;height: 280px;margin: 40px auto;" ref="chart-preview"></div>
          </el-tab-pane>
        </el-tabs>

      </el-col>
    </el-row>
    <span slot="footer" class="dialog-footer">
        <el-button type="cancel" @click="dialogVisible = false">{{ $t('PLUGIN.CUSTOM_DASHBOARD.CANCEL') }}</el-button>
        <el-button type="save" @click="submit">{{ $t('PLUGIN.CUSTOM_DASHBOARD.CONFIRM') }}</el-button>
      </span>
  </el-dialog>
</template>

<script>
import singleSeries from "../template/singleSeries.js"
import doubleSeries from "../template/doubleSeries.js"
import * as echarts from "echarts";
var timer = null;
const fun = (i) => {
  return "/**\n" +
      " * 在这里编写代码，生成 表盘" + i + " 的模拟数据\n" +
      " */\n" +
      "return +(Math.random() * 60).toFixed(2);"
}
const baseStyle = {
  type: "gauge",
  // 文字
  detail: { color: "#409EFF", fontSize: 20, offsetCenter: [0, '70%'] },
  itemStyle: { color: "#409EFF" },
  // 指针
  pointer: { show: true },
  // 进度条
  progress: { show: true, width: 18 },
  // 轴线
  axisLine: { show: true, roundCap: true, lineStyle: { width: 18} },
  // 标签
  axisLabel: { show: true, fontSize: 14, distance: 17 },
  // 分隔线
  splitLine: { show: true, length: 0, lineStyle: {width: 2, color: '#999'} },
  // 刻度
  axisTick: { show: false },
  // 圆心
  anchor: { show: true, showAbove: true, size: 5, itemStyle: {borderWidth: 10} },
  data: [{ value: 30 }]
}
/**
 * 在这里编写代码，生成表盘的模拟数据
 */
export default {
  name: "CustomEchartDialog",
  props: {
    dark: {
      type: [Boolean],
      default: true
    },
    visible: {
      type: [Boolean],
      default: false
    }
  },
  data() {
    return {
      dialogVisible: false,
      // 左侧tab的value
      leftActive: "option",
      // 图表类型： single-单图表（默认），double-双图表
      seriesType: "",
      seriesOptions: [
        { label: "单表盘", value: 1 }, { label: "双表盘", value: 2 }
      ],
      jsonOptionText: "",
      // 是否开启随机数据
      startRandom: false,
      // 模拟数据的刷新间隔，默认为2秒
      customInterval: 2,
      // 模拟数据的Tab的当前选中值
      randomTabsValue: "dashboard1",
      // 模拟数据的Tabs
      randomTabs: [],
      // 样式设置的Tab的当前选中值
      styleTabsValue: "dashboard1",
      // 样式设置的Tabs
      styleTabs: [],
      // 右侧tab的value
      rightActive: "preview",
      myChart: null,
      // 当前值后缀
      currentValueEnds: "",
      // 当前值在纵轴的位置
      offsetCenterY: 70,
      chartStyle: []
    }
  },
  watch: {
    /**
     * 监听图表配置的修改状态
     */
    jsonOptionText: {
      handler(newValue) {
      },
      deep: true
    },
    /**
     * 监听父组件传过来的visible的值
     */
    visible: {
      handler(newValue) {
        this.dialogVisible = newValue;
      },
      immediate: true
    },
    /**
     * 图表样式数据
     */
    chartStyle: {
      handler(newValue) {
        Object.keys(newValue).forEach(key => {
          console.log(newValue[key])
          // this.jsonOptionText[key] = newValue[key];
        })
        let option = { series: [ {...newValue} ]}

        console.log("====.option:", option);
        this.myChart.setOption(option);
      },
      deep: true
    },
    /**
     * 当前值文本后缀
     */
    currentValueEnds: {
      handler(newValue) {
        let option = { series: [ { detail: { formatter: "{value}" + newValue} } ]}
        this.myChart.setOption(option);
      },
    },
    /**
     * 当前值文本在纵轴的位置
     */
    offsetCenterY: {
      handler(newValue) {
        let option = { series: [ { detail: { offsetCenter: [0, newValue]} } ]}
        this.myChart.setOption(option);
      },
    }
  },
  mounted() {

  },
  methods: {
    /**
     * 改变图表类型（单表盘/双表盘）时的回调
     */
    changeSeriesType(value) {
      if (value == 1) {
        this.jsonOptionText = singleSeries;
      } else if (value == 2) {
        this.jsonOptionText = doubleSeries;
      }
      this.jsonOptionInput(this.jsonOptionText);
    },
    /**
     * 图表配置里文本域的值被修改时
     * @param value
     */
    jsonOptionInput(value) {
      let str = value += ";\n return option;"
      let fn = new Function(str);
      this.customOption = fn();
      this.randomTabs = [];
      this.jsonFunctionArr = [];
      this.styleTabs = [];
      this.chartStyle = [];
      for (let i = 0; i < this.customOption.series.length; i++) {
        this.randomTabs.push({ title: "表盘" + (i+1), name: "dashboard" + (i+1), content: fun(i+1) })
        this.jsonFunctionArr.push(fun(i+1));

        this.styleTabs.push({ title: "表盘" + (i+1), name: "dashboard" + (i+1), value: this.customOption.series[i]});
        this.chartStyle.push(baseStyle)
      }
      console.log("====jsonOptionInput", this.customOption)
      this.initEchartsPreview(this.customOption)
    },
    handleChangeStyle() {
      console.log("====chartStyle", this.chartStyle);
      this.customOption.series = [];
      this.chartStyle.forEach(item => {
        this.customOption.series.push(item);
      })
      console.log("====customOption", this.customOption);
      this.initEchartsPreview(this.customOption)
    },
    /**
     * 初始化图标预览
     * @param option
     */
    initEchartsPreview(option) {
      if (this.myChart) {
        this.myChart.clear();
      }
      this.myChart = echarts.init(this.$refs["chart-preview"]);
      this.$nextTick(function() {
        this.myChart.resize();
      });
      this.myChart.setOption(option);
      this.setRandomData();
    },
    /**
     * 开启/关闭随机数据
     * @param value 选择框的值
     */
    changeRandomState() {
      this.setRandomData();
    },
    randomInput() {
      console.log(this.randomTabs)
      this.jsonFunctionArr = [];
      this.randomTabs.forEach(item => {
        this.jsonFunctionArr.push(item.content);
      });
      this.setRandomData();
    },

    /**
     * 随机数据
     */
    setRandomData() {
      clearInterval(timer);
      if (!this.startRandom) {
        return;
      }
      let this_ = this;
      timer = setInterval(function() {
        let series = [];
        this_.jsonFunctionArr.forEach(fun => {
          let fn = new Function(fun)
          console.log(fn)
          let value = fn();
          series.push({ data: [ { value } ] })
        })
        this_.myChart.setOption({series})
      }, this_.customInterval * 1000)
    },
    submit() {
      if (!this.customOption.series) {
        return;
      }
      this.customOption.simulator = {};
      this.customOption.simulator.funcArr = this.jsonFunctionArr;
      // this.customOption.simulator.funcArr.push(this.jsonFunction);
      this.customOption.simulator.interval = this.customInterval * 1000;
      // this.chartList.push(this.customOption)
      this.dialogVisible = false;
      this.$emit("submit", JSON.parse(JSON.stringify(this.customOption)))
    },
    closed() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.option-pane-select-div {
  padding: 6px 0 6px 10px;
}
.random-pane-div {
  padding: 20px 30px 30px 50px;
}
.ui-tab-pane {
  padding: 10px 20px 10px 20px;
}
.ui-pane-form  {
  height: 400px;
  padding: 20px 30px 30px 50px;
  overflow-y: auto;
}
.ui-pane-form .el-input {
  width: 80px;
}
.dialog-footer {
}
/deep/ .el-tabs--card > .el-tabs__header .el-tabs__nav{
  border: none !important;
}
/deep/ .el-tabs__item{
  border: none !important;
  color: #fff!important;
  background: #4455d9 !important;;
}
/deep/ .el-tabs__item.is-active {
    color: #fff!important;
    background: #4093ff !important;
    border: none !important;
}
</style>