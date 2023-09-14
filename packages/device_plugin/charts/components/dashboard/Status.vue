<template>
  <div class="status-container" @click="showDialog(null)">
    <div class="center">
      <p :style="'font-size: ' + (mapData.series.fontSize || '20') + 'px;'">{{ mapData.series.title }}</p>
      <p :style="'font-size: ' + (mapData.series.labelSize || '30') + 'px;color: ' + mapData.series.labelColor+';'">
        <i :class="labelIcon"></i>{{ label }}
      </p>
    </div>
    <el-dialog class="dark-dialog" :title="$t('PLUGIN.CHART_INFO_TAB.TEXT1')" width="700px" :visible.sync="dialogVisible" :append-to-body="true" :close-on-click-modal="false">
      <el-tabs v-model="tabsValue">
        <el-tab-pane style="height: 300px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE')" name="map">
          <div class="add-chart-map-container">
            <el-form :label-position="'left'" label-width="100px" style="margin: 20px">
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE3')">
                <el-input v-model="mapData.name"></el-input>
              </el-form-item>
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE4')">
                <!-- 从json中解析出物模型的所有属性 -->
                <el-select style="width: 100%; margin-bottom: 10px;" :placeholder="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE8')" v-model="mapData.map">
                  <el-option v-for="(option, index) in dataSrc" :key="index" :value="option.name" >
                    {{option.title + '(' + option.name + ')'}}
                  </el-option>
                </el-select>
              </el-form-item>

              <el-row :gutter="20" style="margin-bottom: 10px" v-for="(item, index) in mapData.series.status" :key="index">
                <el-col :span="7" style="display: inline-flex">
                  <span style="width: 100px;text-align: center;margin-top:6px">{{ $t('PLUGIN.CHART_INFO_TAB.TAB_TITLE9') }}</span>
                  <el-select :placeholder="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE8')" v-model="item.comparison">
                    <el-option v-for="(comparison, index) in comparisons" :key="index" :label="comparison" :value="comparison"></el-option>
                  </el-select>
                </el-col>
                <el-col :span="6" style="display: inline-flex">
                  <span style="width: 80px;text-align: center;margin-top:6px">{{ $t('PLUGIN.CHART_INFO_TAB.TAB_TITLE10') }}</span>
                  <el-input v-model="item.value"></el-input>
                </el-col>
                <el-col :span="8" style="display: inline-flex">
                  <span style="width: 60px;text-align: center;margin-top:6px">{{ $t('PLUGIN.CHART_INFO_TAB.TAB_TITLE11') }}</span>
                  <el-input v-model="item.label"></el-input>
                </el-col>
                <el-col :span="3" style="display: inline-flex">
                  <el-button v-if="item.addEnable" type="primary" @click="handleAddItem">{{ $t('PLUGIN.CHART_INFO_TAB.ADD') }}</el-button>
                  <el-button v-if="item.delEnable" type="danger" @click="handleDelItem(item)">{{ $t('PLUGIN.CHART_INFO_TAB.DELETE') }}</el-button>
                </el-col>
              </el-row>

            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane style="height: 300px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE2')" name="ui">
          <div class="add-chart-map-container">
            <el-form :label-position="'left'" label-width="100px">
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE5')">
                <el-input v-model="mapData.title"></el-input>
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
import { message_error } from "@/utils/helpers"
import optionData from "../../options/options.json"
export default {
  name: "CommonStatus",
  props: {
    value: {
      type: [Number, String, Boolean, Object],
      default: 0
    },
    option: {
      type: [Object],
      default: () => { return {} }
    },
    dataSrc: {
      type: [Array],
      default: () => { return [] }
    },
  },
  data() {
    return {
      optionData: {},
      fontSize: 30,   // 标题文字大小
      title: "",   // 标题
      label: "",  // 信息
      labelSize: 20,   // 信息文字大小
      labelColor: "#DC143CFF",  // 信息文字颜色,
      labelIcon: "",
      status: [],
      mapping: [],
      dialogVisible: false,   // 是否显示绑定图表对话框
      tabsValue: "map",
      dataSrcOptions: [],
      mapData: {
      type: "status",
      series: {
        title: "液位",
        fontSize: 20,
        value: 0,
        status: [
          {
            comparison: "==",
            value: 0,
            label: "缺液",
            color: "#",
            fontSize: 30,
            icon: "",
            addEnable: true,
          },
          {
            comparison: "==",
            value: 1,
            label: "有液",
            fontSize: 30
          }
        ]
      }
    },
      comparisons: ["==", ">", ">=", "<", "<=", "!="]
    }
  },
  watch: {
    value: {
      handler(newVal) {
        console.log("====status.value", newVal)
        if (newVal !== null) {
          this.label = this.mapData.series.status.find(item => item.value.toString() == newVal.toString())?.label || "";
        }
      },
      immediate: true
    },
    option: {
      handler(newVal) {
        if (newVal)
          this.mapData = JSON.parse(JSON.stringify(newVal));
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    showDialog(option) {
      if (this.mapping && this.mapping.length > 0) return;
      if (option) {
        this.mapData = JSON.parse(JSON.stringify(option));
      }
      this.dialogVisible = true;
    },
    handleAddItem() {
      this.mapData.series.status.push({comparison: "", map: "", label: "", addEnable: false, delEnable: true})
    },
    handleDelItem(condition) {
      if (this.mapData.series.status.length == 1) return;
      let index = this.mapData.series.status.findIndex(item => item == condition);
      this.mapData.series.status.splice(index, 1);
    },
    submit() {
      if (!this.validate()) return;

      let opt = JSON.parse(JSON.stringify(this.mapData));
      opt.controlType = "information";
      opt.mapping = [this.mapData.map];
      opt.series.mapping = [this.mapData.map];
      console.log("====status.submit", opt)
      this.$emit("bind", opt);
      this.dialogVisible = false;
    },
    validate() {
      if (!this.mapData.name) {
        message_error("名称不能为空");
        return false;
      }
      if (!this.mapData.map) {
        message_error("数据源不能为空");
        return false;
      }
      return true;
    }
  }
}

/**
 * 比较
 * @param leftVal
 * @param rightVal
 * @param comp
 * @returns {boolean}
 */
const toCompare = (leftVal, rightVal, comp) => {
  if (comp == "==") return leftVal == rightVal;

  if (comp == ">") return Number(leftVal) > Number(rightVal);

  if (comp == ">=") return Number(leftVal) >= Number(rightVal);

  if (comp == "<") return Number(leftVal) < Number(rightVal);

  if (comp == "<=") return Number(leftVal) <= Number(rightVal);

  if (comp == "!=") return leftVal != rightVal;
}

const iconList = [
    "el-icon-warning", "el-icon-warning-outline", "el-icon-success", "el-icon-circle-check", "el-icon-error", "el-icon-circle-check",
    "el-icon-s-flag", "el-icon-s-opportunity", "el-icon-umbrella", "el-icon-close-notification", "el-icon-switch-button",
    "el-icon-switch-button", "el-icon-light-rain", "el-icon-lightning", "el-icon-heavy-rain",
    "el-icon-sunrise", "el-icon-sunny", "el-icon-moon", "el-icon-phone-outline"
]
</script>

<style scoped lang="scss">
.status-container {
  width: 100%;
  height: 100%;
  display: table;
  position: absolute;
  top: 0px;
  .center {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    p {
      margin: 10px;
    }

  }
}

</style>