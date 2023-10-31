<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-10-12 20:49:12
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-31 16:18:07
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\console\Dashboard.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div id="containerId" class="dashboard-container" :style="getContainerStyle">
    <div class="dashboard-top" v-if="mode!=='share'">
      <div >
        <el-button type="border" size="small" icon="el-icon-back" @click="back">返回</el-button>
      </div>
      <div class="dashboard-tools">
        <el-button v-if="mode === 'edit'" type="border" size="small" icon="el-icon-plus"
          @click="addDialogVisible = true">新增</el-button>

        <el-button v-if="mode === 'edit'" type="border" size="small" icon="el-icon-setting"
          @click="settingDialogVisible = true"></el-button>

        <el-button v-if="mode === 'edit'" type="border" size="small" icon="el-icon-download"></el-button>
        <el-button v-if="mode === 'view'" type="border" size="small" icon="el-icon-edit-outline"
          @click="mode = 'edit'"></el-button>

        <el-button type="border" size="small" icon="el-icon-full-screen" @click="handleFullScreen"></el-button>

        <el-divider v-if="mode === 'edit'" direction="vertical"></el-divider>

        <el-button v-if="mode === 'edit'" type="border" size="small" @click="handleCancel">取消</el-button>

        <el-button v-if="mode === 'edit'" type="indigo" size="small" @click="handleSaveConsole">保存</el-button>
      </div>
    </div>


    <div v-if="viewData.template.length !== 0 || editData.template.length !== 0" id="consoleBox" style="width: 100%;overflow-y: auto;" :style="getConsoleBoxStyle">
      <grid-layout :class="mode==='edit' ? 'grid-layout' : ''"  
        :layout.sync="mode === 'view' ? viewData.template : editData.template"
        :col-num="colNum" :row-height="30" :is-draggable="mode === 'edit'" :is-resizable="mode === 'edit'"
        :is-mirrored="false" :vertical-compact="true" :margin="[10, 10]" :use-css-transforms="true"
        @layout-updated="handleLayoutUpdatedEvent">

        <grid-item class="grid-item" v-for="(option, index) in (mode === 'view' ? viewData.template : editData.template)"
          :key="option['id'] + index" :x="option.x" :y="option.y" :w="option.w" :h="option.h" :i="option.i">

          <e-charts class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"  :show-config="true"
            v-if="option.controlType == 'dashboard' && !option.type" :option="option" :device="option.device"
            :value="option.value" :status="option.deviceStatus" :mode="mode" :select.sync="option.select"
            @changeName="name => changeName(option, name)" @config="handleShowConfig">
            <el-checkbox v-if="mode === 'edit'" v-model="option.select"></el-checkbox>
          </e-charts>

          <curve class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"  :show-config="true"
            :mode="mode" v-if="option.controlType == 'history'" :option="option" :value="option.value"
            :select.sync="option.select" :status="option.deviceStatus" :device="option.device"
            @changeName="name => changeName(option, name)" @config="handleShowConfig">
            <el-checkbox v-if="mode === 'edit'" v-model="option.select"></el-checkbox>
          </curve>

          <status class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"  :show-config="true"
            :mode="mode" v-if="option.controlType == 'dashboard' && option.type == 'status'" :option="option"
            :select.sync="option.select" :status="option.deviceStatus" :device="option.device"
            @changeName="name => changeName(option, name)" @config="handleShowConfig">
            <el-checkbox v-if="mode === 'edit'" v-model="option.select"></el-checkbox>
          </status>

          <device-status class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"  :show-config="true"
            :mode="mode" v-if="option.controlType == 'dashboard' && option.type == 'deviceStatus'" :option="option"
            :value="option.value" :select.sync="option.select" :status="option.deviceStatus" :device="option.device"
            @changeName="name => changeName(option, name)" @config="handleShowConfig">
            <el-checkbox v-if="mode === 'edit'" v-model="option.select"></el-checkbox>
          </device-status>

          <signal-status class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"  :show-config="true"
            :mode="mode" :status="option.deviceStatus" v-if="option.type == 'signalStatus'" :option="option"
            :device="option.device" :value="option.value" :select.sync="option.select"
            @changeName="name => changeName(option, name)" @config="handleShowConfig">
            <el-checkbox v-if="mode === 'edit'" v-model="option.select"></el-checkbox>
          </signal-status>

          <text-info class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"  :show-config="true"
            :mode="mode" :status="option.deviceStatus" v-if="option.type == 'textInfo'" :option="option"
            :device="option.device" :value="option.value" :select.sync="option.select"
            @changeName="name => changeName(option, name)" @config="handleShowConfig">
            <el-checkbox v-if="mode === 'edit'" v-model="option.select"></el-checkbox>
          </text-info>

          <control class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"  :show-config="true"
            :mode="mode" :device="option.device" v-if="option.controlType == 'control'" :option="option"
            :select.sync="option.select" :disabled="true" :status="option.deviceStatus"
            @changeName="name => changeName(option, name)" @config="handleShowConfig">
            <el-checkbox v-if="mode === 'edit'" v-model="option.select"></el-checkbox>
          </control>

          <video-component class="component-item" style="min-width: 200px;min-height: 200px"
            :ref="'component_' + option.i" :key="option['id']" :show-header="true" :mode="mode"  :show-config="true"
            v-if="option.controlType == 'video'" :option="option" :select.sync="option.select"
            :status="option.deviceStatus" @changeName="name => changeName(option, name)" @config="handleShowConfig">
            <el-checkbox v-if="mode === 'edit'" v-model="option.select"></el-checkbox>
          </video-component>
        </grid-item>

      </grid-layout>
    </div>
    <!-- 添加组件 -->
    <add-component :visible.sync="addDialogVisible" @change="handleAddComponent" />
    <!-- 看板配置 -->
    <setting :visible.sync="settingDialogVisible" :data.sync="settingData" />
    <!-- 单个图表配置 -->
    <component-config :visible.sync="cptConfigVisible" :data="configData" @change="handleComponentConfig"/>
  </div>
</template>

<script>
import { GridLayout, GridItem } from "vue-grid-layout";
import ECharts from "./components/Echarts";
import Curve from "./components/Curve";
import Control from "./components/Control";
import Status from "./components/Status";
import SignalStatus from "./components/SignalStatus";
import DeviceStatus from "./components/DeviceStatus";
import TextInfo from "./components/TextInfo"
import VideoComponent from "./components/Video";
import AddComponent from "./AddComponent.vue";
import Setting from "./Setting.vue";
import ComponentConfig from "./ComponentConfig.vue";
import screenfull from "screenfull";
import { websocket } from "@/utils/websocket";
import { getDeviceListStatus } from "@/api/device.js";
import ConsoleAPI from "@/api/console.js";
import { DEFAULT_SETTING_DATA } from "./Const.js";
export default {
  components: {
    GridLayout, GridItem, AddComponent, Setting, ComponentConfig,
    ECharts, Curve, Control, Status, SignalStatus, DeviceStatus, VideoComponent
  },
  props: {},
  data() {
    return {
      // grid-layout的列数
      colNum: 24,
      // 是否显示添加组件对话框
      addDialogVisible: false,
      // 是否显示设置对话框
      settingDialogVisible: false,
      // 图表配置对话框
      cptConfigVisible: false,
      // 模式  view: 查看模式  edit: 编辑模式 share: 分享模式
      mode: "view",
      // 查看模式下的看板数据
      viewData: {
        template: [],
        data: []
      },
      // 编辑模式下的看板数据
      editData: {
        template: [],
        data: []
      },
      // 参数
      params: {},
      // websocket
      socket: null,
      // Webscket列表
      sockets: [],
      // 心跳计时器
      beatHeartTimers: [],
      // 看板配置
      settingData: {...DEFAULT_SETTING_DATA},
      // 组件数据
      configData: {}
    }
  },
  computed: {
    /**
     * @description: 看板容器
     * @return {*}
     */    
    getContainerStyle() {
      if (this.mode === "share") {
        return { height: "100vh" };
      } 
      return {};
    },
    /**
     * @description: 看板样式
     * @return {*}
     */    
    getConsoleBoxStyle() {
      const { config } = this.settingData;
      const height = this.mode === "share" ? "100%" : "calc(100% - 160px)";
      if (config && config !== "{}") {
        const { background } = JSON.parse(config);
        return { background, height }
      }
      return { height };
    }
  },
  watch: {
    $route: {
      handler(route) {
        console.log(route)
        if (route.path === "/share_console") {
          this.mode = "share"
        }
        this.params = { ...route.query };
        this.initConsole();
      }, immediate: true
    },
  },
  beforeDestroy() {
    this.clearSockets();
    this.clearBeatHearts();
  },
  methods: {
    /**
     * @description: 返回上一页
     * @return {*}
     */    
    back() {
      this.$router.push({ name: "Console", query: { ...this.params } })
    },
    /**
     * @description: 调整容器大小时图表自适应
     * @param {*} layouts
     * @return {*}
     */    
    handleLayoutUpdatedEvent(layouts) {
      layouts.forEach(item => {
        let ref = this.$refs["component_" + item.i];
        if (ref && ref[0]) {
          console.log("handleLayoutUpdatedEvent", ref[0])
          ref[0].sizeChange();
        }
      })
    },
    /**
     * @description: 初始化看板
     * @return {*}
     */
    initConsole() {
      ConsoleAPI.get({ id: this.params.id })
        .then(({ data: result }) => {
          if (result.code === 200) {
            let { id, name, code, config, template, data } = result.data;
            if (template && template !== "{}") {
              template = JSON.parse(template);
            } else {
              template = [];
            }
            if (data && data !== "{}") {
              data = JSON.parse(data);
            } else {
              data = [];
            }
            this.viewData = { ...result.data, template, data };
            // 设备id存入组件
            this.viewData.template.forEach(item => {
              item.device = { deviceId: this.viewData.data.find(d => d.uId === item.uId).deviceId };
              item.deviceStatus = { status: false, lastPushTime: "" }
            });
            this.editData = JSON.parse(JSON.stringify(this.viewData));
            this.settingData = { id, name, code, config }

            console.log("viewData.template", this.viewData.template.length);
            this.updateComponents();
          }
        })
    },
    /**
     * @description: 保存看板
     * @return {*}
     */
    handleSaveConsole() {
      console.log("handleSaveConsole", this.viewData);
      this.editData.template = this.editData.template.filter(item => item.select);
      this.viewData.template = JSON.parse(JSON.stringify(this.editData.template));
      let uIds = this.editData.template.map(item => item.uId);
      let tmp = [];
      uIds.forEach(uId => {
        const d = this.editData.data.find(d => d.uId === uId);
        tmp.push(d);
      })
      this.viewData.data = tmp;
      // 当前看板设置为查看模式
      this.mode = "view";
      const params = {
        id: this.viewData.id,
        data: JSON.stringify(this.viewData.data),
        template: JSON.stringify(this.viewData.template)
      }
      ConsoleAPI.edit(params)
        .then(({ data: result }) => {
          console.log("handleSaveConsole", result);

        })
      this.updateComponents();
    },
    /**
     * @description: 取消
     * @return {*}
     */
    handleCancel() {
      this.mode = "view";
      let tmp = JSON.parse(JSON.stringify(this.viewData.template));
      this.viewData.template = [];
      setTimeout(() => {
        this.viewData.template = tmp;
        this.editData.template = JSON.parse(JSON.stringify(tmp));
        this.updateComponents();
      }, 50);
    },
    /**
     * @description: 改变图表名称
     * @param {*} option
     * @param {*} name
     * @return {*}
     */
    changeName(option, name) {
      if (option.name !== name) {
        option.name = name;
      }
    },
    /**
     * @description: 添加组件
     * @param {*} v1 添加的图表
     * @param {*} v2 设备
     * @return {*}
     */
    handleAddComponent(v1, v2) {
      let opts = JSON.parse(JSON.stringify(this.viewData.template.concat(v1)));
      // 设备v2和图表id添加到data中
      opts.forEach(item => {
        const deviceId = typeof v2 === "string" ? v2 : v2[1]
        this.editData.data.push({ uId: item.uId, deviceId })
      })
      this.editData.template = this.getDefaultLayout(opts, 4);
      this.$nextTick(() => {
        this.editData.template.forEach(item => {
          let ref = this.$refs["component_" + item.i];
          if (ref && ref[0]) {
            ref[0].sizeChange();
          }
        });
        this.updateComponents();
      })

    },
    /**
     * @description: 
     * @param {*} v
     * @return {*}
     */    
    handleComponentConfig(v) {
      let tmp = JSON.parse(JSON.stringify(this.editData.template));
      const index = tmp.findIndex(item => item.uId === v.uId);
      tmp.splice(index, 1, JSON.parse(JSON.stringify(v)));
      this.editData.template = [];
      setTimeout(() => this.editData.template = tmp, 50);
    },
    /**
     * @description: 全屏
     * @return {*}
     */
    handleFullScreen() {
      let element = document.getElementById("consoleBox"); //指定全屏区域元素
      screenfull.toggle(element); //全屏显示
    },
    /**
     * 获取默认布局
     * @param options
     * @param col
     * @returns {*}
     */
    getDefaultLayout(options, col) {
      // 每个元素的宽占几列
      let colW = this.colNum / col;
      // 每个元素的高占几行
      let rowH = colW;
      // 列数，行数
      let colI = 0, rowI = 0;
      for (let i = 0; i < options.length; i++) {
        if (colI == col) {
          // 如果超过4列则换行
          rowI++;
          colI = 0;
        }
        options[i].w = colW;
        options[i].h = rowH;
        options[i].x = colI * colW;
        options[i].y = rowI * rowH;
        options[i].i = i;
        colI++;
      }
      return options;
    },

    /**
     * 更新组件的值
     */
    async updateComponents() {
      const options = this.viewData.template;

      if (!options || !options.length) return;

      

      console.log("this.viewData.template", this.viewData.template);


      // 去除重复设备
      const deviceIds = this.viewData.data.map(item => item.deviceId);
      const set = new Set(deviceIds);
      const uniqueDeviceIds = [...set];
      console.log("uniqueDeviceIds", uniqueDeviceIds);

      // 先执行一次刷新设备在线/离线状态
      this.flushDeviceStatus(uniqueDeviceIds);
      // 先执行一次获取历史数据
      this.getHistory();

      // 根据设备列表创建websocket连接
      for (let i = 0; i < uniqueDeviceIds.length; i++) {
        const socket = this.sockets[i];
        const deviceId = uniqueDeviceIds[i];
        if (socket) {
          socket.close();
          socket = null;
        }
        socket = new websocket();
        socket.init();
        socket.onReady(() => {
          socket.send({ device_id: deviceId });
          // 发送心跳
          this.beatHeartTimers.push(setInterval(() => {
            socket.send({ type: "ping" });
          }, 30 * 1000));
        })
        // 接收消息
        socket.onMessage((result) => {
          try {
            let data = JSON.parse(result)
            // 通过设备id和值更新组件的值
            this.setComponentsValue(deviceId, data)
          } catch (err) {
          }
        })
      }

      // 轮询获取设备在线/离线状态
      setInterval(() => {
        this.flushDeviceStatus(uniqueDeviceIds);
      }, 20 * 1000);

    },
    /**
     * @description: 通过设备id和值更新组件的值
     * @param {*} deviceId
     * @param {*} data
     * @return {*}
     */
    setComponentsValue(deviceId, data) {

      // 通过deviceId获取对应的图表
      const cpts = this.viewData.data.filter(item => item.deviceId === deviceId);
      if (!cpts || !cpts.length) return;
      for (let i = 0; i < cpts.length; i++) {
        const cpt = cpts[i];
        const option = this.viewData.template.find(item => item.uId === cpt.uId);
        let mapping = option.dataSource || null;
        let values = null;
        // 刷新图表最近推送时间
        option.deviceStatus.lastPushTime = data.systime || (new Date()).Format("yyyy-MM-dd hh:mm:ss");
        // 刷新图表数据
        if (option.controlType == "dashboard" || option.controlType == "information") {
          if (option.type == "deviceStatus") {
            values = data.systime || "";
          } else if (option.type == "signalStatus" || option.type == "textInfo") {
            if (data && data[mapping[0].name]) {
              values = data[mapping[0].name];
            } else {
              values = null;
            }
          } else {
            console.log("dashboard.onMessage", deviceId, data);

            values = mapping.map(item => {
              if (data && data[item.name]) {
                return { ...item, value: data[item.name] || "" }
              }
              return { ...item, value: "" }
            });

          }

        } else if (option.controlType == "control") {
          mapping = option.series.map(item => item.mapping.attr)
          values = {};
          mapping.forEach(item => {
            if (data && data[item]) {
              values[item] = data[item];
            }
          });
        } else if (option.controlType === "history") {
          console.log("curve.history", mapping, data, option);
          values = {};
          mapping.forEach(item => {
            if (data && data[item.name]) {
              values[item.name] = data[item.name];
              values["systime"] = data["systime"];
            }
          });
        }
        this.$nextTick(() => {
          const ele = this.$refs["component_" + option.i];
          if (ele && ele[0]) {
            this.$refs["component_" + option.i][0].updateOption(values);
          }
        })
      }
    },
    /**
     * 刷新设备在线/离线状态
    */
    async flushDeviceStatus(deviceIds) {
      const params = { device_id_list: deviceIds };

      try {
        let { data: result } = await getDeviceListStatus(params);
        if (result.code === 200) {
          const deviceStatusList = result.data;
          for (let i = 0; i < this.viewData.template.length; i++) {
            const option = this.viewData.template[i];
            for (const deviceId in deviceStatusList) {
              const status = deviceStatusList[deviceId].toString() === "1";

              if (option.device.deviceId === deviceId) {
                let tmp = JSON.parse(JSON.stringify(option));
                tmp.deviceStatus = { lastPushTime: option.deviceStatus.lastPushTime, status };
                // tmp.state = status;
                this.viewData.template.splice(i, 1, tmp);
                // console.log("option.deviceStatus", tmp.state);
                // option.deviceStatus = { lastPushTime: option.deviceStatus.lastPushTime, status }
                // option.deviceStatus1 = JSON.stringify(option.deviceStatus);
                // console.log("option.deviceStatus1", option.deviceStatus, option.deviceStatus1);
              }
              // debugger;

            }
          }
        }

      } catch (err) {
        console.log("dashboard.error", err.message);
      }

    },
    getHistory() {
      this.$nextTick(() => {
        this.viewData.template.forEach(item => {
          if (item.controlType === "history") {
            let ref = this.$refs["component_" + item.i];
            if (ref && ref[0]) {
              ref[0].getHistory();
            }
          }
        })
      })
    },
    /**
     * @description: 清空sockets
     * @return {*}
     */
    clearSockets() {
      for (let i = 0; i < this.sockets.length; i++) {
        const socket = this.sockets[i];
        if (socket) {
          socket.close();
          socket = null;
        }
      }
      this.sockets = [];
    },
    /**
     * @description: 清空心跳计时器
     * @return {*}
     */
    clearBeatHearts() {
      for (let i = 0; i < this.beatHeartTimers.length; i++) {
        const timer = this.beatHeartTimers[i];
        if (timer) {
          clearInterval(timer);
        }
      }
      this.beatHeartTimers = [];
    },
    /**
     * @description: 打开图表配置
     * @param {*} opt
     * @return {*}
     */    
    handleShowConfig(opt) {
      console.log("handleShowConfig", opt);
      this.cptConfigVisible = true;
      this.configData = JSON.parse(JSON.stringify(opt));
    }
  }
}
</script>
<style lang="scss" scoped>

.dashboard-container {
  // height: 100vh;
  .dashboard-top {
    margin-top: -20px;
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;

    .el-button--small {
      margin-top: 0;
      height: 32px;
      line-height: 32px;
      padding: 0px 15px;
    }
    .dashboard-tools {
      width: 100%;
      text-align: right;

      .el-button--small {
        margin-top: 0;
        height: 32px;
        line-height: 32px;
        padding: 0px 15px;
      }

      .el-divider.el-divider--vertical {
        height: 26px;
        line-height: 26px;
        margin: 0px 14px;
        padding: 0px;
      }
    }
  }
}


.grid-box {
  width: 100%;
  height: 100%;
  min-height: 225px;
  margin-top: 20px;
}

.component-item {
  width: 100%;
  height: 100%;
  //position: absolute;
  top: 0;
  left: 0;
}
.grid-layout {
    content: '';
    background-size: calc(calc(100% - 2px) / 24) 40px;
    background-image: linear-gradient(
            to right,
            #2d3d88 1px,
            transparent 1px
    ),
    linear-gradient(to bottom, #2d3d88 1px, transparent 1px);
    height: calc(100% - 2px);
    width: calc(100% - 2px);
    background-repeat: repeat;
    margin: 2px;
}
</style>