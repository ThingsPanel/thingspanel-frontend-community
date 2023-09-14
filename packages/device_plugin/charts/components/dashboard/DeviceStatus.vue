<!-- 设备状态仪表盘 -->
<template>
  <div class="device-status-container" @click="showDialog(null)">
    <div class="center">
      <div class="device-status-box">设备状态: {{ value }}</div>
      <div class="device-push-time-box">最近推送时间: {{ pushTime }}</div>
    </div>
    <el-dialog class="dark-dialog" :title="$t('PLUGIN.CHART_INFO_TAB.TEXT1')" width="500px" :visible.sync="dialogVisible" :append-to-body="true" :close-on-click-modal="false">
      <el-tabs v-model="tabsValue">
        <el-tab-pane style="height: 300px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE')" name="map">
          <div class="add-chart-map-container">
            <el-form ref="mapFormRef" :label-position="'top'" label-width="100px" style="margin: 20px"
                     :model="formData" :rules="formRule">
              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE3')" prop="name">
                <el-input v-model="formData.name"></el-input>
              </el-form-item>

              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE12')" prop="thresholdTime">
                <el-input-number v-model="formData.thresholdTime" :min="5"></el-input-number>
              </el-form-item>


            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane style="height: 300px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE2')" name="ui">
          <div class="add-chart-map-container">
            <el-form :label-position="'left'" label-width="100px">
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
import i18n from "@/core/plugins/vue-i18n.js"
export default {
  name: "CommonDeviceStatus",
  props: {
    option: {
      type: [Object],
      default: () => { return {} }
    },
    value: {
      type: [String],
      default: "离线"
    },
    mode: {
      type: [String],
      default: ""
    },
    pushTime: {
      type: [String],
      default: "无"
    }
  },
  data() {
    return {
      tabsValue: "map",
      formData: {
        name: i18n.t('PLUGIN.CHART_INFO_TAB.TAB_TITLE15'),
        thresholdTime: 60   // 离线时间阈值
      },
      formRule: {
        name: [{required: true, message: i18n.t('PLUGIN.CHART_INFO_TAB.TAB_TITLE13')}],
        thresholdTime: [{required: true, message: i18n.t('PLUGIN.CHART_INFO_TAB.TAB_TITLE14')}]
      },
      fontSize: 30,   // 标题文字大小
      title: "",   // 标题
      dialogVisible: false,   // 是否显示绑定图表对话框
    }
  },
  methods: {
    showDialog(option) {
      console.log("====tpDeviceStatus", option)
      if (this.mode != "edit") return;
      if (option) {
        let { name, thresholdTime } = option;
        this.formData = { name, thresholdTime }
      }
      this.dialogVisible = true;
    },
    submit() {
      let opt = JSON.parse(JSON.stringify(this.option));
      this.$refs.mapFormRef.validate(valid => {
        if (!valid) return;
        opt.controlType = "information";
        opt.name = this.formData.name;
        opt.thresholdTime = this.formData.thresholdTime;
        this.$emit("bind", opt);
        this.dialogVisible = false;
      })

    }
  }
}
</script>

<style scoped lang="scss">
.device-status-container {
  width: 100%;
  height: 100%;
  display: table;
  .center {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    .device-status-box {
      margin: 10px;
      color: #fff;
    }
    .device-push-time-box {
      color: #fff;
    }
  }
}
</style>