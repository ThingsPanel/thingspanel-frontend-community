<template>
  <div class="charts-panel-content">

    <div class="charts-panel-list" >
      <div class="charts-panel-item" v-for="(option, index) in chartList" :key="'history' + index">
        <e-chart style="width: 300px;height: 300px" :option="option" :data-src="dataSrc" @clickChart="showDialog"></e-chart>
      </div>
    </div>

    <!-- 绑定历史数据 /-->
    <el-dialog :class="'history-dialog' + dark?'dark-dialog':''" :title="$t('PLUGIN.CHART_INFO_TAB.TEXT1')" width="665px" :close-on-click-modal="false"
               :visible.sync="dialogVisible" :append-to-body="true">
      <el-tabs v-model="tabsValue">
        <el-tab-pane style="height: 440px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE')" name="map">
          <div class="add-chart-map-container">
            <el-form class="history-form" label-position="top" label-width="100">
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE3')" style="width: 100%">
                <el-input style="flex-grow: 1" v-model="historyName"></el-input>
              </el-form-item>
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE4')">
                <!-- 从json中解析出物模型的所有属性 -->
                <el-transfer style="width: 100%;height: 240px"
                             :titles="['数据源', '已选择数据源']"
                             v-model="dataSrcValue"
                             :data="dataSrcOptions"></el-transfer>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane style="height: 300px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE2')" name="ui">
          <div class="add-chart-map-container">
            <el-form :label-position="'left'">
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE16')">

              </el-form-item>
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE6')">

              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

      </el-tabs>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t('PLUGIN.CHART_INFO_TAB.CANCEL') }}</el-button>
        <el-button type="primary" @click="submit">{{ $t('PLUGIN.CHART_INFO_TAB.CONFIRM') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import EChart from "../../components/dashboard/EChart"
import {message_error} from "@/utils/helpers";
export default {
  name: "HistoryPanel",
  components: { EChart  },
  props: {
    dark: {
      type: [Boolean],
      default: true
    },
    /**
     * 图表组件列表
     */
    charts: {
      type: [Object, Array],
      default: () => []
    },
    /**
     * 物模型数据，用来生成数据源
     */
    dataSrc: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      chartList: [],
      dialogVisible: false,
      chartOption: {},
      // tab标签
      tabsValue: "map",
      // 名称
      historyName: "",
      // 绑定的数据源
      dataSrcValue: [],
      // 数据源
      dataSrcOptions: []
    }
  },
  watch: {
    // 图表列表
    charts: {
      handler(newValue) {
        this.chartList = JSON.parse(JSON.stringify(newValue));
      },
      immediate: true
    },
    // 数据源
    dataSrc: {
      handler(newValue) {
        if (newValue.length == 0) return;
        for (let i = 0; i < this.dataSrc.length; i++) {
          this.dataSrcOptions.push({key: this.dataSrc[i]['name'], label: this.dataSrc[i]['title'] + '(' + this.dataSrc[i]['name'] + ')'})
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 显示绑定对话框
     * @param v
     */
    showDialog(option) {
      this.chartOption = option;
      this.dialogVisible = true;
      if (!option.id) {
        // 添加
        this.historyName = "";
        this.dataSrcValue = [];
      } else {
        // 编辑
        this.historyName = option.name;
        this.dataSrcValue = option.mapping;
      }
    },
    /**
     * 提交
     */
    submit() {

      if (this.historyName == "") {
        message_error("名称不能为空")
        return;
      }
      if (this.dataSrcValue.length == 0) {
        message_error("请选择数据源")
        return;
      }
      let option = JSON.parse(JSON.stringify(this.chartOption));
      option.name = this.historyName;   // 图表名称
      option.mapping = this.dataSrcValue;  // 绑定的属性
      option.controlType = "history";  // 图表类型
      // 初始化图表
      option.series = [];
      let mappingArr = this.dataSrc.filter(item => {
        return option.mapping.findIndex(map => map == item.name) >= 0;
      });
      mappingArr.forEach(item => {
        option.series.push({ data: [0], "type": "line", name: item.title});
      })
      option.xAxis.data = [''];     // 初始化图表
      this.$emit("submit", option)
      this.dialogVisible = false;
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
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
  width: 300px;
  height: 300px;
  margin: 6px;
  cursor:pointer;
  text-align: center;
}

</style>