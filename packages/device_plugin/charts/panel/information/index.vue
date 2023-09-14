<template>
    <div class="charts-panel-content">
      <div class="charts-panel-list">
        <div class="charts-panel-item" v-for="(option, index) in chartList" :key="'dashboard'+index">
          <tp-status v-if="option.type=='status'" ref="tpStatus" :option="option" :data-src="dataSrc" @bind="handleBind"></tp-status>
          <tp-device-status v-else-if="option.type=='deviceStatus'" ref="tpDeviceStatus" mode="edit" :option="option" @bind="handleBind"></tp-device-status>
          <tp-signal-status v-else-if="option.type=='signalStatus'" ref="tpSignalStatus" :data-src="dataSrc" mode="edit" :option="option" @bind="handleBind"></tp-signal-status>
          <tp-text-info v-else-if="option.type=='textInfo'" ref="tpTextInfo" :option="option" :data-src="dataSrc" mode="edit" @bind="handleBind"/>
        </div>
      </div>
  
  
    </div>
  </template>
  
  <script>
  import TpStatus from "../../components/dashboard/Status"
  import TpEChart from "../../components/dashboard/EChart"
  import TpSignalStatus from "../../components/dashboard/SignalStatus"
  import TpDeviceStatus from "../../components/dashboard/DeviceStatus"
  import TpTextInfo from "../../components/dashboard/TextInfo"

  import global from "../../../common/global";
  import {message_error} from "@/utils/helpers";
  
  export default {
    name: "InformationPanel",
    components: { TpEChart, TpStatus, TpSignalStatus, TpDeviceStatus, TpTextInfo },
    props: {
      charts: {
        type: [Object, Array],
        default: () => []
      },
      dataSrc: {
        type: [Array],
        default: () => []
      }
    },
    data() {
      return {
        chartList: [],
        dialogVisible: false,
        customDialogVisible: false,
        tabsValue: "map",
        // 图表名称
        chartName: "",
        // 标题
        chartTitle: "",
        // 图表数据
        chartOption: {},
        // 数据源选择的值
        dataSrcOptions: [],
        fontSize: 30,
        backgroundColor: "#2d3d86"
      }
    },
    watch: {
      charts: {
        handler(newValue) {
          this.chartList = JSON.parse(JSON.stringify(newValue));
        },
        immediate: true
      },
      /**
       * 数据源
       */
      dataSrc: {
        handler(newValue) {
          if (newValue.length == 0) return;
        },
        immediate: true
      }
    },
    created() {
      this.theme = global.theme;
    },
    methods: {
      /**
       * 点击图表回调父组件的clickChart函数
       * @param v
       */
      showDialog(option) {
        console.log("====showDialog", option)
        this.chartOption = option;
        if (option.type == "status") {
          this.$nextTick(() => {
            this.$refs["tpStatus"][0].showDialog(option);
          })
          return;
        } else if (option.type == "deviceStatus") {
          this.$nextTick(() => {
            this.$refs["tpDeviceStatus"][0].showDialog(option);
          })
          return;
        } else if (option.type == "signalStatus") {
          this.$nextTick(() => {
            console.log("====tpSignalStatus", this.$refs["tpSignalStatus"])
            this.$refs["tpSignalStatus"][0].showDialog(option);
          })
          return;
        } else if (option.type === "textInfo") {
          this.$refs["tpTextInfo"][0].showDialog(option);
          return;
        }
        this.dialogVisible = true
        this.dataSrcOptions = [];
  
        if (!option.id) {
          // 新增
          this.chartName = "";
          for (let i = 0; i < option.series.length; i++) {
            this.dataSrcOptions.push({})
          }
        } else {
          // 编辑
          this.chartTitle = option.series[0].data[0].name ? option.series[0].data[0].name : "";
          this.fontSize = option.series[0].detail.fontSize;
          this.chartName = option.name;
          for (let i = 0; i < option.series.length; i++) {
            this.dataSrcOptions.push({value: option.mapping[i]})
          }
        }
      },
      submit() {
        if (this.chartName == "") {
          message_error("名称不能为空！")
          return;
        }
        let option = JSON.parse(JSON.stringify(this.chartOption));
        option.name = this.chartName;
        option.mapping = [];
        option.controlType = "information"
        option.series[0].data[0].name = this.chartTitle;
        option.series[0].detail.fontSize = this.fontSize;
        if (option.series.length > 1) {
          option.series[1].data[0].name = this.chartTitle;
          option.series[1].detail.fontSize = this.fontSize;
        }
        option.style = {};
        // 背景颜色
        option.style.backgroundColor = this.backgroundColor;
        // 不透明度
        option.style.opacity = 1;
        this.dataSrcOptions.forEach(item => option.mapping.push(item.value));
        this.$emit("submit", option)
        this.dialogVisible = false;
      },
      /**
       *
       * @param v
       */
      addChart(v) {
        this.chartList.push(v);
      },
      /**
       * 仪表盘选择数据源
       * @param item
       */
      changeMappingDataSource(item) {
        let source = this.dataSrc.find(v => v.name == item.value);
        this.chartName = source.title;
      },
      handleCustom() {
        this.customDialogVisible = true;
      },
      handleBind(opt) {
        this.$emit("submit", opt)
      }
    }
  }
  </script>
  
  <style scoped>
  div {
    text-align: left;
  }
  .charts-panel-content {
    padding-top: 10px;
  }
  .charts-panel-list {
    display: flex;
    flex-flow: wrap;
    width: 1000px;
    height: 580px;
    float: left;
    overflow-y: auto;
    margin: 0 auto;
  }
  
  
  .charts-panel-item {
    position: relative;
    display: inline-block;
    box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
    width: 300px;
    height: 300px;
    margin: 6px;
    cursor:pointer;
    text-align: center;
  }
  .charts-panel-item .custom-card {
    justify-items: center;
    align-content: center;
  }
  .add-chart-map-container {
    padding: 50px 30px 0px 30px
  }
  </style>