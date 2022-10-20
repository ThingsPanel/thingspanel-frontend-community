<template>
  <div class="chart-div">
    <div class="chart-header">
      <span class="title">{{ optionData.name }}</span>
      <div class="tool-right">
        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
      </div>
    </div>

    <common-control :option="optionData" @change="handleChange"></common-control>
<!--    <el-switch style="margin-top:100px" v-model="switchValue" active-color="#13ce66" inactive-color="#ff4949" :width="60"></el-switch>-->

    <el-dialog title="配置" width="30%"
               :visible.sync="configurationVisible">
      <span></span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>

  </div>

</template>

<script>
import { turnSwitch } from "@/api/device"
import { currentValue } from "@/api/device";
import {message_success} from "../../../../utils/helpers";
export default {
  name: "Control",
  props: {
    option: {
      type: [Object],
      default: () => {return {}}
    },
    device: {
      type: [Object],
      default: () => {return {}}
    }
  },
  data() {
    return {
      switchValue: true,
      configurationVisible: false,
      dialogVisible: false,
      controlType: "",
      optionData: {},
      timer: "",
      flushTime: 5
    }
  },
  beforeDestroy() {
    clearTimer();
  },
  mounted() {
    this.optionData = JSON.parse(JSON.stringify(this.option));
    this.controlType = this.optionData.controlType;
    this.updateControl();
  },
  methods: {
    handleChange(v) {
      // 获取绑定的属性
      let mapping = this.option.mapping
      // 获取每个开关的值 v
      // 属性和开关的值对应
      let obj = {};
      for (let i = 0; i < mapping.length; i++) {
        obj[mapping[i]] = v[i];
      }
      let param = {device_id: this.device.device, "values": obj}

      turnSwitch(param)
        .then(({data}) => {
          if (data.code == 200) {
            message_success("设备状态更新成功")
          }
        })
    },
    updateControl() {
      if (this.timer) {
        clearInterval(this.timer);
      }

      this.getSwitchValue();
      this.timer = setInterval(() => {
        this.getSwitchValue();
      }, this.flushTime * 1000);
      addTimer(this.timer);

    },
    getSwitchValue() {
      let optionTmp = JSON.parse(JSON.stringify(this.optionData));
      let param = { entity_id: this.device.device, attribute: this.option.mapping }
      currentValue(param)
          .then(({data}) => {
            if (data.code == 200) {
              let map = optionTmp.mapping;
              for (let i = 0; i < map.length; i++) {
                if (data.data[0][map[i]] == "true") {
                  optionTmp.series[i].value = true;
                } else if (data.data[0][map[i]] == "false") {
                  optionTmp.series[i].value = false;
                }
              }
              this.optionData = JSON.parse(JSON.stringify(optionTmp))
            }
          })
    }
  }
}
const addTimer = (timer) => {
  var timers = JSON.parse(localStorage.getItem("timers"));
  if (!timers) {
    timers = [];
  }
  timers.push(timer);
  localStorage.setItem("timers", JSON.stringify(timers))
}
const clearTimer = () => {
  var timers = JSON.parse(localStorage.getItem("timers"));
  if (timers && timers.length > 0)
    timers.forEach(timer => clearInterval(timer))
  localStorage.setItem("timers", null);
}
</script>


<style scoped lang="scss">
.chart-div {
  margin: 10px 20px 10px 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #2d3d86;
  text-align: center;
}
.chart-header {
  position: relative;
  display: flex;
  width: 100%;
  height: 40px;
  padding-left: 10px;
  text-align: right;
  box-shadow: 0 2px 0px 0 rgba(0, 0, 0, 0.1);
  .title {
    //width: 100%;
    //flex-grow: 1;
    color: #fff;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 18px;
  }
  .tool-right {
    position: absolute;
    text-align: center;

    top:4px;
    right: 4px;
  }
  .tool-item {
    background: transparent!important;
    border: 0px solid transparent;
  }
}
</style>