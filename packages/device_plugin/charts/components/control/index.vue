<!-- 控制组件 -->
<template>
  <div class="switch-container" @click="clickSwitch">
    <div class="switch-component-title" v-if="showName">{{ optionData.componentName}}</div>
    <div class="switch-list">
      <div class="switch-item" v-for="item in optionData.series" :key="item.type + item.id">

        <CommonSwitch :ref="item.type + 'ref'" :key="item.type + item.id" v-if="item.type=='switch'" :disabled="optionData.disabled" :value="item.value"
                  @change="v => handleChange(item, v)"/>

        <SlideSwitch :ref="item.type + 'ref'" :key="item.type + item.id" v-if="item.type=='slider'" :disabled="optionData.disabled"
                  :value.sync="item.value" :max="item.mapping.max" :step="item.mapping.step"
                  @change="v => handleChange(item, v)"/>

        <SetValue :ref="item.type + 'ref'" :key="item.type + item.id" v-if="item.type=='setValue'" :disabled="optionData.disabled" :value.sync="item.value"
                  @change="v => handleChange(item, v)"/>
                  
        <SendAttribute :ref="item.type + 'ref'" :key="item.type + item.id" v-if="item.type=='sendAttribute'" :mode="mode" :option="optionData" :disabled="!!optionData.disabled" :value.sync="item.value"
                  :dataSrc="dataSrc" @change="v => handleChange(item, v)" @bind="handleBind" @send="handleSend"/>

        <SendCommand :ref="item.type + 'ref'" :key="item.type + item.id" v-if="item.type=='sendCommand'" :mode="mode" :option="optionData" :disabled="!!optionData.disabled" :value.sync="item.value"
                  :dataSrc="dataSrc" @change="v => handleChange(item, v)" @bind="handleBind" @send="handleSend"/>


        <MainSwitch :ref="item.type + 'ref'" :key="item.type + item.id" v-if="item.type=='mainSwitch'" :disabled="optionData.disabled" :value.sync="item.value"
                  @change="v => handleChange(item, v)"
        ></MainSwitch>

      </div>
    </div>

  </div>
</template>

<script>
import CommonSwitch from "./Switch.vue"
import SlideSwitch from "./SlideSwitch.vue"
import SetValue from "./SetValue.vue"
import SendAttribute from "./SendAttribute.vue"
import SendCommand from "./SendCommand.vue"
import MainSwitch from "./MainSwitch";

export default {
  name: "CommonControl",
  components: {
    CommonSwitch, SlideSwitch, SetValue, SendAttribute, SendCommand, MainSwitch
  },
  props: {
    mode: {
      type: [String],
      defualt: ""
    },
    type: {
      type: [String],
      default: "switch"
    },
    showName: {
      type: [Boolean],
      default: false,
    },
    option: {
      type: [Object],
      default: () => {return {}}
    },
    dataSrc: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      optionData: {}
    }
  },
  watch: {
    option: {
      handler(newValue) {
        if (JSON.stringify(newValue) == "{}") return;

        this.optionData = JSON.parse(JSON.stringify(newValue));
        console.log("Control.option", this.optionData)
        // 重新渲染
        // this.$forceUpdate();
      },
      immediate: true,
      deep: true
    }
  },
  mounted() {
  },
  methods: {
    showDialog(option) {
      this.$refs[option.type + "ref"][0].showDialog(option);
    },
    handleSend(cb) {
        this.$emit("send", cb);
    },
    clickSwitch() {
      this.$emit("click", this.option);
    },
    handleChange(item, value) {
      console.log("====handleChange", value)
      let index = this.optionData.series.findIndex(v => v.id == item.id);
      let serie = JSON.parse(JSON.stringify(item));
      serie.value = value;
      this.optionData.series.splice(index, 1, serie);
      console.log(JSON.stringify(this.optionData.series))
      this.$emit("change", this.optionData);
    },
    handleBind(option) {
      console.log("handleBind", option)
      this.$emit("bind", option)
    }
  }
}
</script>

<style scoped>
.switch-container {
  width:100%;
  height:100%;
  text-align: center;
  display: table;
  position: absolute;
  top: 0px;
}
.switch-list {
  top: 0;
  display: table;
  vertical-align: middle;
}
.switch-component-title {
  position: absolute;
  width: 100%;
  height: 30px;
  top: 10px;
  text-align: center;
}
.switch-item {
  /*height: 60px;*/
  /*line-height: 60px;*/
  display: table-cell;
      vertical-align: middle;
      text-align: center;
}


</style>