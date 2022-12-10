<template>
  <div class="status-container" @click="showDialog">
    <div class="center">
      <p :style="'font-size: ' + fontSize + 'px;'">{{ title }}</p>
      <p :style="'font-size: ' + labelSize + 'px;color: ' + labelColor+';'">
        <i :class="labelIcon"></i>{{ label }}
      </p>
    </div>
    <el-dialog class="dark-dialog" title="绑定图表" width="700px" :visible.sync="dialogVisible" :append-to-body="true" :close-on-click-modal="false">
      <el-tabs v-model="tabsValue">
        <el-tab-pane style="height: 300px"  label="绑定数据*" name="map">
          <div class="add-chart-map-container">
            <el-form :label-position="'left'" label-width="100px" style="margin: 20px">
              <el-form-item label="名称">
                <el-input v-model="mapData.name"></el-input>
              </el-form-item>
              <el-form-item label="选择数据源">
                <!-- 从json中解析出物模型的所有属性 -->
                <el-select style="width: 100%; margin-bottom: 10px;" v-model="mapData.srcValue">
                  <el-option v-for="(option, index) in dataSrc" :key="index" :value="option.name" >
                    {{option.title + '(' + option.name + ')'}}
                  </el-option>
                </el-select>
              </el-form-item>

              <el-row :gutter="20" style="margin-bottom: 10px" v-for="(condition, index) in mapData.conditions" :key="index">
                <el-col :span="7" style="display: inline-flex">
                  <span style="width: 80px;text-align: center;margin-top:6px">条件：</span>
                  <el-select v-model="condition.operator">
                    <el-option v-for="(operator, index) in operators" :key="index" :label="operator" :value="operator"></el-option>
                  </el-select>
                </el-col>
                <el-col :span="6" style="display: inline-flex">
                  <span style="width: 60px;text-align: center;margin-top:6px">值：</span>
                  <el-input v-model="condition.value"></el-input>
                </el-col>
                <el-col :span="8" style="display: inline-flex">
                  <span style="width: 60px;text-align: center;margin-top:6px">信息：</span>
                  <el-input v-model="condition.label"></el-input>
                </el-col>
                <el-col :span="3" style="display: inline-flex">
                  <el-button v-if="condition.addEnable" type="primary" @click="handleAddCondition">添加</el-button>
                  <el-button v-if="condition.delEnable" type="danger" @click="handleDelCondition(condition)">删除</el-button>
                </el-col>
              </el-row>

            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane style="height: 300px" label="界面配置" name="ui">
          <div class="add-chart-map-container">
            <el-form :label-position="'left'" label-width="100px">
              <el-form-item label="标题：">
                <el-input v-model="mapData.title"></el-input>
              </el-form-item>
              <el-form-item label="文本大小：">
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

      </el-tabs>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submit">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "CommonStatus",
  props: {
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
      value: null,   // 传入的值
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
        name: "",
        conditions: [
          {
            operator: "",
            srcValue: "",
            label: "",
            addEnable: true,
            delEnable: false
          }
        ]
      },
      operators: ["==", ">", ">=", "<", "<=", "!="]
    }
  },
  watch: {
    option: {
      handler(newValue) {
        if (newValue.series) {
          if (newValue.series.fontSize) this.fontSize = newValue.series.fontSize;
          if (newValue.series.title) this.title = newValue.series.title;
          if (newValue.series.status) this.status = newValue.series.status;
          if (newValue.series.value != null && newValue.series.value != undefined) {
            this.value = newValue.series.value;
            this.status.forEach(item => {
              if (toCompare(this.value, item.value, item.comparison)) {
                this.label = item.label;
                if (item.icon) this.labelIcon = item.icon;
                if (item.fontSize) this.labelSize = item.fontSize;
              }
            })
          }
        }
        if (newValue.mapping) this.mapping = newValue.mapping;
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    showDialog(formData) {
      if (this.mapping && this.mapping.length > 0) return;
      this.mapData = {
        name: "",
            conditions: [
          {
            operator: "",
            srcValue: "",
            label: "",
            addEnable: true,
            delEnable: false
          }
        ]
      }
      this.dialogVisible = true;
    },
    handleAddCondition() {

      this.mapData.conditions.push({operator: "", srcValue: "", label: "", addEnable: false, delEnable: true})
    },
    handleDelCondition(condition) {
      if (this.mapData.conditions.length == 1) return;
      let index = this.mapData.conditions.findIndex(item => item == condition);
      this.mapData.conditions.splice(index, 1);
    },
    submit() {
      if (!this.mapData.name || !this.mapData.srcValue) return;

      let opt = JSON.parse(JSON.stringify(this.option));
      opt.controlType = "dashboard";
      opt.name = this.mapData.name;
      opt.mapping = [];
      opt.mapping.push(this.mapData.srcValue);
      opt.series.title = this.mapData.title ? this.mapData.title : this.mapData.name;
      opt.series.status = this.mapData.conditions.map(item => {
        return {comparison: item.operator, value: item.value, label: item.label,}
      })
      this.$emit("bind", opt);
      this.dialogVisible = false;
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
  .center {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    p {
      margin: 10px;
    }

  }
}
//::v-deep .el-form-item {
//  width: 100%;
//}
//::v-deep .el-form-item__content {
//  width: 100%;
//  display: inline-flex;
//  margin-left: 0px!important;
//}
</style>