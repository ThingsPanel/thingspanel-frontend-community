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
      flushTime: 5,
      mapping: []
    }
  },
  watch: {
    option: {
      handler(newValue) {
        // this.updateControl();
      }
    }
  },
  beforeDestroy() {
    clearTimer();
  },
  mounted() {
    this.optionData = JSON.parse(JSON.stringify(this.option));
    this.controlType = this.optionData.controlType;
    console.log("====mounted", this.optionData)
    this.mapping = this.option.series.map(item => {return item.mapping.value})
    this.updateControl();
  },
  methods: {
    handleChange(v) {
      // 获取绑定的属性
      let values = {};
      v.series.forEach(item => {
        values[item.mapping.value] = item.value ? item.mapping.on : item.mapping.off;
      })

      let param = { device_id: this.device.device, values }
      // 控制设备状态
      turnSwitch(param)
        .then(({data}) => {
          if (data.code == 200) {
            message_success("设备状态更新成功")
          }
        })
    },
    updateControl() {
      // if (this.timer) {
      //   clearInterval(this.timer);
      // }
      this.getSwitchValue();
      this.timer = setInterval(() => {
        this.getSwitchValue();
      }, this.flushTime * 1000);
      addTimer(this.timer);

    },
    getSwitchValue() {
      let optionTmp = JSON.parse(JSON.stringify(this.optionData));
      let param = { entity_id: this.device.device, attribute: this.mapping }
      currentValue(param)
          .then(({data}) => {
            if (data.code == 200 && data.data) {
              let dataObj = data.data[0];
              optionTmp.series.forEach(item => {
                let map = item.mapping;
                if (dataObj[map.value] == map.on) {
                  item.value = true;
                } else if (dataObj[map.value] == map.off){
                  item.value = false;
                }
              })
              this.optionData = JSON.parse(JSON.stringify(optionTmp))
            }
          })
    }
  }
}
const addTimer = (timer) => {
  let timers = JSON.parse(localStorage.getItem("timers"));
  if (!timers) {
    timers = [];
  }
  timers.push(timer);
  localStorage.setItem("timers", JSON.stringify(timers))
}
const clearTimer = () => {
  let timers = JSON.parse(localStorage.getItem("timers"));
  if (timers && timers.length > 0 && timer!="undefined") {
    timers.forEach(timer => clearInterval(timer))
    localStorage.setItem("timers", null);
  }
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