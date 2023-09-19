<template>
  <div class="charts-panel-content">
    <div class="charts-panel-list">
      <div class="charts-panel-item" v-for="(control, index) in controlList" :key="'item_'+index">
        <control :ref="control.type + control.series[0].id" style="width: 300px;height: 300px" 
          :dataSrc="dataSrc" :show-name="true" :option="control"  mode="edit"
          @click="showDialog(control, control.series[0].id)" @bind="submit"/>
      </div>
    </div>

    <!-- 绑定echart图表 /-->
    <el-dialog :class="theme + '-dialog'" :title="$t('PLUGIN.CHART_INFO_TAB.TEXT1')" width="500px" :visible.sync="dialogVisible" :append-to-body="true" :close-on-click-modal="false">
      <el-tabs v-model="tabsValue">
        <el-tab-pane style="height: 300px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE')" name="map">
          <div class="add-chart-map-container">
            <el-form :label-position="'left'">
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE3')">
                <el-input v-model="controlName"></el-input>
              </el-form-item>
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE4')">
                <!-- 从json中解析出物模型的所有属性 -->
                <div class="datasrc-item" v-for="(item, index) in dataSrcOptions" :key="index">
                  <el-select style="width: 100%; margin-bottom: 10px;"
                             v-model="item.value">
                    <el-option v-for="(option, index) in dataSrc" :key="index"
                              :disabled="!option.readWrite || option.readWrite === 'r'"
                              :label="option.title + '(' + option.name + ')' + (option.readWrite !== 'rw' ? ' - 只读' : '')"
                              :value="option.name" ></el-option>
                  </el-select>

                  <el-row :gutter="20" v-if="item.type=='switch'">
                    <el-col :span="12" style="display: inline-flex">
                      <span style="width: 60px;text-align: center">{{ $t('PLUGIN.CHART_INFO_TAB.TAB_TITLE17') }}</span>
                      <el-input v-model="item.on"></el-input>
                    </el-col>
                    <el-col :span="12" style="display: inline-flex">
                      <span style="width: 60px;text-align: center">{{ $t('PLUGIN.CHART_INFO_TAB.TAB_TITLE18') }}</span>
                      <el-input v-model="item.off"></el-input>
                    </el-col>
                  </el-row>

                  <el-row :gutter="20" v-if="item.type=='slider'">
                    <el-col :span="12" style="display: inline-flex">
                      <span style="width: 80px;text-align: center">{{ $t('PLUGIN.CHART_INFO_TAB.TAB_TITLE19') }}</span>
                      <el-input v-model="item.max"></el-input>
                    </el-col>
                    <el-col :span="12" style="display: inline-flex">
                      <span style="width: 60px;text-align: center">{{ $t('PLUGIN.CHART_INFO_TAB.TAB_TITLE20') }}</span>
                      <el-input v-model="item.step"></el-input>
                    </el-col>
                  </el-row>

                  <el-divider ></el-divider>
                </div>

              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane style="height: 300px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE2')" name="ui">
          <div class="add-chart-map-container">
            <el-form :label-position="'left'">

              <el-form-item label="">
                <el-checkbox v-model="disabledChecked">{{ $t('PLUGIN.CHART_INFO_TAB.TAB_TITLE21') }}</el-checkbox>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

      </el-tabs>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t('PLUGIN.CHART_INFO_TAB.CANCEL') }}</el-button>
        <el-button type="primary" @click="submit(null)">{{ $t('PLUGIN.CHART_INFO_TAB.CONFIRM') }}</el-button>
      </span>
    </el-dialog>

<!--    绑定场景开关对话框-->
    <el-dialog :class="theme + '-dialog'" :title="$t('PLUGIN.CHART_INFO_TAB.TEXT1')" width="665px" :visible.sync="sceneDialogVisible" :append-to-body="true" :close-on-click-modal="false">
      <el-tabs v-model="tabsValue">
        <el-tab-pane style="height: 440px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE')" name="map">
          <div class="add-chart-map-container">
            <el-form ref="sceneFormRef" :label-position="'top'" :rules="sceneFormRule">
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE3')" prop="controlName">
                <el-input v-model="controlName"></el-input>
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


      </el-tabs>
      <span slot="footer" class="dialog-footer">
        <el-button @click="sceneDialogVisible = false">{{ $t('PLUGIN.CHART_INFO_TAB.CANCEL') }}</el-button>
        <el-button type="primary" @click="submit">{{ $t('PLUGIN.CHART_INFO_TAB.CONFIRM') }}</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import Control from "../../components/control"
import global from "../../../common/global";
import {message_error} from "@/utils/helpers";
import i18n from "@/core/plugins/vue-i18n.js"
export default {
  name: "ControlPanel",
  components: { Control },
  props: {
    controls: {
      type: [Array],
      default: () => []
    },
    dataSrc: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      controlList: [],
      dialogVisible: false,
      sceneDialogVisible: false,
      tabsValue: "map",
      // 是否禁用开关
      disabledChecked: false,
      // 组件名称
      controlName: "",
      dataSrcOptions: [],
      controlOption: {},
      dataSrcValue: [],
      sceneFormRule: {
        "controlName": [{ required: true, message: i18n.t('PLUGIN.CHART_INFO_TAB.TAB_TITLE13') }]
      }
    }
  },
  watch: {
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
    if (this.controls.length == 0) return;
    this.controlList = JSON.parse(JSON.stringify(this.controls))
    console.log("controlList", this.controlList)
  },
  methods: {
    /**
     * 显示绑定对话框
     * @param v
     */
    showDialog(option, id) {
      console.log("control.panel", option)
      this.controlOption = option;
      if (option.type && option.type === "scene") {
        // if (this.$refs.sceneFormRef.validate(valid => {
        //   if (!valid) return;
        // }))
        // 场景开关
        this.sceneDialogVisible = true;
        this.dataSrcOptions = [];
        for (let i = 0; i < this.dataSrc.length; i++) {
          this.dataSrcOptions.push({
              key: this.dataSrc[i]['name'], 
              label: this.dataSrc[i]['title'] + '(' + this.dataSrc[i]['name'] + ')',
              disabled: this.dataSrc[i]['readWrite'] !== 'rw' ? true : false,
            })
        }
        this.dataSrcValue = option.mapping;
        this.controlName = option.name;
      } else if (option.type === "switch" || option.type === "slider" || option.type === "setValue") {
        this.dialogVisible = true;
        this.dataSrcOptions = [];
        this.disabledChecked = option.disabled ? option.disabled : false;
        if (!option.id) {
          // 添加
          this.controlName = "";
          for (let i = 0; i < option.series.length; i++) {
            this.dataSrcOptions.push({type: option.series[i].type})
          }
        } else {
          this.controlName = option.name;
          for (let i = 0; i < option.series.length; i++) {
            this.dataSrcOptions.push(
                {
                  type: option.series[i].type,
                  value: option.series[i].mapping.value,
                  on: option.series[i].mapping.on,
                  off: option.series[i].mapping.off,
                  max: option.series[i].mapping.max,
                  step: option.series[i].mapping.step
                }
            );
          }
        }
      } else if (option.type === "sendAttribute" || option.type === "sendCommand") {
        this.$refs[option.type + (id || option.series[0].id)][0].showDialog(option);
      }
    },
    /**
     * 绑定组件
     */
    submit(opt) {
      console.log("submit", opt, this.controlOption)
      if (!opt && !this.validate()) return;
      let option = opt || JSON.parse(JSON.stringify(this.controlOption))
      if (option.type && option.type == "scene") {
        // 场景开关
        option.name = this.controlName;
        option.disabled = this.disabledChecked;
        option.mapping = this.dataSrcValue;
        this.sceneDialogVisible = false;
      } else if (option.type === "switch" || option.type === "slider" || option.type === "setValue") {
        for(let i = 0; i < this.dataSrcOptions.length; i++) {
          let obj = {};
          obj.value = this.dataSrcOptions[i].value;
          obj.on = this.dataSrcOptions[i].on;
          obj.off = this.dataSrcOptions[i].off;
          obj.max = this.dataSrcOptions[i].max;
          obj.step = this.dataSrcOptions[i].step;
          obj.attr = this.dataSrc.find(v => v.name == obj.value)
          option.series[i].mapping = obj;
        }
        option.name = this.controlName;
        option.disabled = this.disabledChecked;
        this.dialogVisible = false;
      } else if (option.type === "sendAttribute" || option.type === "sendCommand") {
        console.log("sendAttribute", {...opt})
      }
      option.controlType = "control";
      this.$emit("submit", option)
    },
    validate() {
      if (!this.controlName) {
        message_error("名称不能为空！");
        return false;
      }
      this.dataSrcOptions.forEach(item => {
        if (!item.value) {
          message_error("请选择数据源！");
          return false;
        }
        if (item.on === "") {
          message_error("开启的值不能为空！");
          return false;
        }
        if (item.off === "") {
          message_error("关闭的值不能为空！");
          return false;
        }
      })
      return true;
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
.charts-panel-item {
  justify-items: center;
  align-content: center;
}

.el-divider--horizontal {
  height: 1px;
  background-color: #2e3985!important;
}

.add-chart-map-container {
  padding: 10px 20px 10px 10px;
}

</style>