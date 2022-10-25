<template>
  <div class="chart-div">
    <div class="chart-header">
      <span class="title">{{ optionData.name }}</span>
      <div class="tool-right">
        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
      </div>
    </div>

    <common-control :option="optionData" @change="handleChange"></common-control>

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
        if (JSON.stringify(newValue) == "{}") return;
        this.updateControl();
      }
    }
  },
  beforeDestroy() {
    console.log("beforeDestroy")
    clearTimer();
  },
  mounted() {
    this.optionData = JSON.parse(JSON.stringify(this.option));
    this.controlType = this.optionData.controlType;
    this.mapping = this.option.series.map(item => {return item.mapping.value})
    this.updateControl();
  },
  methods: {
    handleChange(v) {
      // 获取绑定的属性
      let values = {};

      v.series.forEach(item => {
        if (item.type == "switch") {
          values[item.mapping.value] = item.value ?
              typeConvert(item.mapping.on, item.mapping.attr.dataType) :
              typeConvert(item.mapping.off, item.mapping.attr.dataType);
        } else if (item.type == "slider") {
          values[item.mapping.value] = Number(item.value);
        }
      })

      let param = { device_id: this.device.device, values };
      // 控制设备状态
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
      let param = { entity_id: this.device.device, attribute: this.mapping }
      currentValue(param)
          .then(({data}) => {
            if (data.code == 200 && data.data) {
              let dataObj = data.data[0];
              optionTmp.series.forEach(item => {
                let map = item.mapping;
                if (item.type == "switch") {
                  if (dataObj[map.value] == map.on) {
                    item.value = true;
                  } else if (dataObj[map.value] == map.off){
                    item.value = false;
                  }
                } else if (item.type == "slider") {
                  item.value = dataObj[map.value];
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
  if (timers && timers.length > 0 && timers!="undefined") {
    timers.forEach(timer => clearInterval(timer))
    localStorage.setItem("timers", null);
  }
}
const typeConvert = (value, type) => {
  if (type.toLowerCase() == "integer") return Number(value);
  if (type.toLowerCase() == "string" || type.toLowerCase() == "text") return String(value);
  if (type.toLowerCase() == "bool" || type.toLowerCase() == "boolean") return Boolean(value);
  if (type.toLowerCase() == "float") return parseFloat(value);
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