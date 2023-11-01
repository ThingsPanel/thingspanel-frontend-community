<template>
  <div class="chart-div">
    <div class="chart-header" v-if="showHeader">
      <span class="title">{{ optionData.name }}</span>
      <div class="tool-right">
        <status-icon ref="statusIconRef" :status="status"/>

        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>
      </div>
    </div>

    <common-control :option="optionData" @change="handleChange" @send="handleSend"></common-control>

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
import { turnSwitch, sendCommandByDeviceId, currentValue } from "@/api/device"
import {message_success} from "@/utils/helpers";
import StatusIcon from "./StatusIcon.vue";
export default {
  name: "Control",
  components: { StatusIcon },
  props: {
    showHeader: {
      type: [Boolean],
      default: false
    },
    option: {
      type: [Object],
      default: () => {return {}}
    },
    device: {
      type: [Object],
      default: () => {return {}}
    },
    status: {
      type: [Boolean, Object],
      default: () => ({})
    }
  },
  data() {
    return {
      switchValue: true,
      configurationVisible: false,
      dialogVisible: false,
      controlType: "",
      optionData: {},
      mapping: [],
    }
  },
  watch: {
    option: {
      handler(newValue) {
        if (JSON.stringify(newValue) == "{}") return;
      }
    }
  },
  mounted() {
    this.optionData = JSON.parse(JSON.stringify(this.option));
    this.controlType = this.optionData.controlType;
    if (this.option.series) {
      this.mapping = this.option.series.map(item => {return item?.mapping?.value || ""})
    }
  },
  methods: {
    async handleChange(v) {
      // 获取绑定的属性
      let values = {};

      v.series.forEach(item => {
        if (item.type == "switch") {
          values[item.mapping.value] = item.value ?
              typeConvert(item.mapping.on, item.mapping.attr.dataType) :
              typeConvert(item.mapping.off, item.mapping.attr.dataType);
        } else if (item.type == "slider" || item.type == "setValue") {
          values[item.mapping.value] = Number(item.value);
        }
      })

      let param = { device_id: this.device.device, values };
      // 控制设备状态
      const { data } = await turnSwitch(param)
      if (data.code == 200) {
        // this.getSwitchValue()
        message_success("设备状态更新成功")
      }
    },
    updateOption(values) {
      this.optionData.series.forEach(item => {
        let map = item.mapping;
        if (item.type == "switch") {
          if (values[map.value] == map.on) {
            item.value = true;
          } else {
            item.value = false;
          }
        } else if (item.type == "slider") {
          item.value = values[map.value];
        }
        this.$refs.statusIconRef.flush();
      });

    },
    async getSwitchValue() {
      let optionTmp = JSON.parse(JSON.stringify(this.optionData));
      let param = { entity_id: this.device.device, attribute: this.mapping }
      let { data } = await currentValue(param)
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
      } else {
        optionTmp.series.forEach(item => {
          if (item.type == "switch") {
              item.value = false;
          } else if (item.type == "slider") {
            item.value = 0;
          }
        })
      }
      // this.optionData = JSON.parse(JSON.stringify(optionTmp))

    },
    async handleSend(cb) {
      try {
        const { type, identifier, name, params, dataType } = this.optionData;
        if (type === "sendCommand") {
          const data = {
              device_id: this.device.device,
              command_identifier: identifier,
              command_data: params,
              command_name: name
          }
          let { data: result } = await sendCommandByDeviceId(data);
          if (result.code === 200) {
            message_success("命令下发成功")
          } else {
            throw new Error("命令下发失败")
          }
          setTimeout(() => {
            cb && cb();
          }, 2000)
        } else if (type === "sendAttribute") {
          const data = {
            device_id: this.device.device,
            values: {}
          }
          data.values[identifier] = typeConvert(params, dataType);
          let { data: result } = await turnSwitch(data);
          if (result.code === 200) {
            message_success("属性下发成功")
          } else {
            throw new Error("属性下发失败")
          }
          setTimeout(() => {
            cb && cb();
          }, 2000)

        }
      } catch(err) {
        message_error(err.messsage);
      }
    },
    sizeChange() {
    }
  }
}

const typeConvert = (value, type) => {
  if (type.toLowerCase() === "integer" || type.toLowerCase() === "number") return Number(value);
  if (type.toLowerCase() == "string" || type.toLowerCase() == "text") return String(value);
  if (type.toLowerCase() == "bool" || type.toLowerCase() == "boolean") return value === 'true' || value === true;
  if (type.toLowerCase() == "float") return parseFloat(value);
}
</script>


<style scoped lang="scss">
.chart-div {
  position: relative;
  //margin: 10px 20px 20px 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #2d3d86;
  border-radius: 4px;
}
.chart-header {
  position: relative;
  display: flex;
  width: 100%;
  height: 40px;
  padding-left: 10px;
  text-align: right;
  z-index: 9999;
  //box-shadow: 0 2px 0px 0 rgba(0, 0, 0, 0.1);
  .title {
    //width: 100%;
    //flex-grow: 1;
    display: flex;
    align-items: center;
    color: #fff;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 18px;
  }
  .tool-right {
    position: absolute;
    display: flex;
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