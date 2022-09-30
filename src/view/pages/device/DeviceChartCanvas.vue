<template>
  <div class="container-canvas" style="width: 100%;height: 100%">

    <!-- 设备信息 -->
    <div class="device-info">
      <el-descriptions class="el-dark-descriptions margin-top" title="设备信息" :column="3" border>

        <el-descriptions-item>
          <template slot="label">
            设备名称
          </template>
          123
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            设备分组
          </template>
          /北研-1
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            推送协议
          </template>
          <el-tag size="small">{{ deviceData.protocol }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label" labelStyle="{'width': '80px'}">
            服务器地址
          </template>

          <ClipButton value="dev.thingspanel.cn"></ClipButton>
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            服务器端口
          </template>
          <ClipButton value="1883"></ClipButton>
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            用户名/Token
          </template>
          <ClipButton :value="deviceData.token"></ClipButton>
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            发布主题(Topic)
          </template>
          <ClipButton value="device/attributes"></ClipButton>
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            推送格式
          </template>
          <ClipButton :value="payloadTemplate"></ClipButton>

        </el-descriptions-item>

      </el-descriptions>
    </div>
    <!-- 图表 -->
    <div v-if="options && options.length > 0" class="container-charts">
      <e-charts style="width: 360px;height: 360px"
                v-for="option in options"  :key="option['id']"
                :option="option" :device="device"></e-charts>
    </div>
    <div class="device-info" v-else>
<!--      <el-button>绑定插件</el-button>-->
<!--      <el-link href="https://element.eleme.io" target="_blank">绑定插件</el-link>-->
    </div>

  </div>
</template>

<script>
import {watch,  defineComponent, ref as reference} from "@vue/composition-api";
import {reactive, ref} from "@vue/composition-api/dist/vue-composition-api";
import ECharts from "./Echarts"
import Clipboard from 'clipboard';
import ClipButton from "@/components/common/ClipButton";

export default defineComponent ({
  name: "DeviceChartCanvas",
  components: {
    ECharts, ClipButton
  },
  props: {
    jsonStr: {
      type: String,
      default: "{}"
    },
    device: {
      type: [Object],
      default: () => { return {} }
    }
  },
  setup(props, context) {
    let options = ref([]);
    let payloadTemplate = ref("{}");
    watch(() => props.jsonStr, value => {
      options.value = JSON.parse(value).chart;
      if (options.value == undefined) {
        return;
      }

      // 获得推送数据示例
      let arr = [];
      options.value.forEach(option => {
        option['mapping'].forEach(map => {
          arr.push(map);
        })
      })
      let temp = {};
      for (let i = 0; i < arr.length; i++) {
        temp[arr[i]] = "值" + (i+1);
      }
      payloadTemplate.value = JSON.stringify(temp);
      console.log("====payloadTemplate", payloadTemplate);
      // 清空计时器
      clearTimer();
    }, {deep: true})
    /*
    {
        "asset_id": "41f52764-8f91-d514-b2fa-2341785b1e50",
        "asset_name": "北研--1",
        "business_id": "576f1328-4f1d-ef48-0875-73688469179a",
        "business_name": "异地协同",
        "d_id": "",
        "device": "de7993f8-bcd5-e708-c8fb-bd204b92a5fb",
        "device_name": "123",
        "device_token": "18e69d7f-f57e-36da-947b-90413c2d4a05",
        "device_type": "c128fecb-8a37-827f-c4c0-6d83cd7bf508",
        "latest_ts": 1663569679450954,
        "location": "",
        "protocol": "mqtt",
        "structure": null,
        "label": "123",
        "leaf": true
    }
     */
    let deviceData = reactive({});

    watch(() => props.device, value => {
      console.log("====device", value)
      deviceData.protocol = value.protocol;
      deviceData.token = value.device_token;

    })


    /**
     * 剪贴板拷贝成功
     * @param e
     */
    function onCopy(e) {
      console.log(e.text)
    }

    /**
     * 剪贴板拷贝失败
     * @param e
     */
    function onError(e) {
      console.log(e)
    }

    return {
      onCopy,
      onError,
      deviceData,
      options,
      payloadTemplate
    }
  }
})
const clearTimer = () => {
  var timers = JSON.parse(localStorage.getItem("timers"));
  if (timers && timers.length > 0)
  timers.forEach(timer => clearInterval(timer))
  localStorage.setItem("timers", null);
}
</script>

<style scoped lang="scss">
.container-canvas {
  width: 100%;
  height: 100%;
  padding: 0px 0px 20px 20px;
}
.container-charts {
  display: flex;
  flex-flow: wrap;
  padding-top: 40px
}
.device-info {
  width: 100%;
  height: 180px;
}
</style>