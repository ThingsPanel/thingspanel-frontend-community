<template>
  <div class="amap-page-container rounded card p-4">
    <div id="screen">
      <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input aa screen-nav">
        <el-col :span="4">
          <BusinessSelector :showAll="true" :business_id.sync="queryParams.business_id" @change="handleChangeBussiness">
          </BusinessSelector>
        </el-col>
        <el-col :span="4">
          <DeviceGroupSelector :showAll="true" @change="handleChangeEquipGroup" :asset_id.sync="queryParams.group_id"
            :business_id.sync="queryParams.business_id">
          </DeviceGroupSelector>
        </el-col>
        <el-col :span="4">
          <el-cascader clearable :placeholder="$t('DEVICE_MAP.PLACEHOLDER1')" @change="handleChangePlugin" v-model="queryParams.plugin_id"
            :options="optionsList" class="w-100">
          </el-cascader>
        </el-col>
        <el-col :span="12">
          <el-button icon="el-icon-full-screen " @click='btn'
            class="btn el-button--default el-button mr-2 el-button--indigo screen-btn">{{ $t('DEVICE_MAP.PLACEHOLDER2') }}</el-button>
        </el-col>
      </el-row>
      <div :style="{ width: '100%', height: '100vh' }" :class='{ amap_box: bindc }' v-loading="loading">
        <el-amap vid="amap" class="amap-box" v-bind="mapConfig" viewMode="3D">

          <el-amap-marker v-for="(marker, index) in markers" :key="'marker_'+index" :position="marker.position" :vid="index"
            :content="marker.content" :label="marker.label" :events="marker.events"></el-amap-marker>

          <el-amap-info-window v-for="(boatWindow, index) in boatWindows" :key="'boatWindow_'+index" :position="boatWindow.position"
            :visible="boatWindow.visible" :content="boatWindow.content" :events="boatWindow.events" :auto-move="true"
            :is-custom="true" :offset="boatWindow.offset" />

        </el-amap>
      </div>
    </div>
  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle.vue";
import BusinessSelector from "@/components/common/BusinessSelector";
import DeviceGroupSelector from "@/components/common/DeviceGroupSelector.vue"
import screenfull from "screenfull";
import PluginAPI from "@/api/plugin.js"
import { AMapManager } from "vue-amap"
let amapManager = new AMapManager();
import { formatDate } from "@/utils/helpers.js"

export default {
  components: {
    TableTitle,
    BusinessSelector,
    DeviceGroupSelector
  },
  data() {
    return {
      loading: false,
      queryParams: {
        business_id: "",
        group_id: "",
        plugin_id: ""
      },
      // 信息窗体
      boatWindows: [],
      boatWindow: {},
      // 点坐标
      markers: [],
      // 全屏切换
      bindc: true,
      mapConfig: {
        zoom: 8,
        center: [100, 30],
        // 地图插件
        plugin: [
          'MapType'
        ],
        amapManager
      },
      // 设备插件列表
      optionsList: [],
      // 插件分类集合
      pluginCategory: []
    };
  },
  created() {
    /*
      1. 获取所有有坐标的设备并渲染到地图上
     */
    this.initMap();
    this.getPluginList();
    // this.getPluginCategory();
    // window.handleSwitch = (value) => {
    //   alert(value)
    // }
  },
  methods: {
    /**
     * 初始化设备标记
     */
    initMap() {
      this.renderDeviceMap({})
    },
    /**
     * 在地图上显示设备
     * @param params
     */
    renderDeviceMap(params) {
      this.loading = true;
      PluginAPI.map(params)
        .then(({ data }) => {
          if (data.code == 200) {
            this.batchCreateMarker(data?.data || []);
          }
        })
        .finally(() => {
          this.loading = false;
        })
    },
    /**
     * 项目选择(第一个)
     * 1.获取项目下设备分组
     * 2.获取项目下所有的设备并展示到地图上
     */
    handleChangeBussiness() {
      // 所有项目
      if (this.queryParams.business_id === 'all') {
        this.queryParams.business_id = "";
      }
      this.queryParams.group_id = '';
      this.renderDeviceMap(this.queryParams)
    },
    /**
     * 设备分组选择(第二个)
     */
    handleChangeEquipGroup() {
      if (this.queryParams.group_id === 'all') {
        this.queryParams.group_id = ''
      }
      this.renderDeviceMap(this.queryParams)
    },
    /**
     * 插件选择(第三个)
     * @param v
     */
    handleChangePlugin(v) {
      if (v.length > 0) {
        this.queryParams.device_model_id = v[1];
      } else {
        this.queryParams.device_model_id = "";
      }
      this.renderDeviceMap(this.queryParams);
    },
    /**
     * 获取插件列表
     */
    getPluginList() {
      PluginAPI.tree({})
        .then(({ data }) => {
          if (data.code == 200) {
            this.optionsList = JSON.parse(JSON.stringify(this.formatterOption(data.data)))
          }
        })
    },
    /**
     * 格式化插件tree返回数据
     * @param data
     * @returns {*}
     */
    formatterOption(data) {
      data.forEach(e => {
        e.value = e.dict_value || e.id
        e.label = e.model_name
        if (e.device_model) {
          e.children = e.device_model
          this.formatterOption(e.children)
        }
      })
      return data
    },
    /**
     * 获取设备状态
     * 
     * @param {{device_id_list: *[]}} idList 设备id集合
     */
    async getEquipStatus(idList) {
      return await PluginAPI.state(idList)
    },
    /**
     * 初始化渲染所有设备
     * @param dataList
     */
    renderMarks(dataList) {
      let deviceList = []
      dataList.forEach(e => {
        deviceList = [...deviceList, ...e.children]
      });
      deviceList.forEach(e => {
        let params = {
          device_model_id: e.id
        }
        this.getEquipInfo(params)
      })
    },
    /**
     * 获取设备基础信息
     * @param {*} params { device_model_id: 插件id}
     */
    getEquipInfo(params) {
      PluginAPI.map(params)
        .then(({ data }) => {
          // 筛选坐标不为空的设备
          let equipList = data.data?.filter(equip => equip.location)
          if (equipList && equipList.length) {
            // 设备状态
            let statusParams = { device_id_list: equipList?.map(e => e.device_id) }
            this.getEquipStatus(statusParams).then(statusList => {
              equipList.forEach(e => {
                e.device_status = statusList[e.device_id]
              })
              /**
               * 更新状态
               */
              this.batchCreateMarker(equipList);
            })
          }
        })
    },
    /**
     * 在地图上批量创建点坐标
     */
    batchCreateMarker(dataList) {
      this.markers = []
      this.boatWindows = {}
      if (!dataList || !dataList.length) {
        return false
      }
      dataList.forEach((el) => {
        this.markers.push({
          position: el.location.split(","),
          label: {
            content: `<div class="label-info">${el.business_name} - ${el.device_name}</div>`,
            offset: [5, 20],
            direction: 'bottom'
          },
          events: {
            click: () => {
              el.position = el.location.split(",")
              this.createWindow(el);
            }
          }
        })
      })
      // 默认展示第一个坐标点信息窗体
      this.createWindow(dataList[0])
    },
    /**
     * 全屏显示
     */
    btn() {
      this.bindc = !this.bindc;
      let element = document.getElementById("screen"); //指定全屏区域元素
      screenfull.toggle(element); //全屏显示
      let aa = document.querySelector('.aa')
      aa.style.position = 'absolute'
    },
    /**
     * 创建信息窗体
     * @param boatData
     * @returns {Promise<void>}
     */
    async createWindow(boatData) {
      console.log("====map.createWindow.boatData", boatData)
      const windows = [];

      /*
        1. 获取设备图表 kv/current/symbol
        2. 判断图表类型，渲染当前值, 开关, 最后推送时间
        3. 获取设备在线/离线状态  device/status
       */
      let currentDOM = "";
      let lastPushTime = "";
      let deviceStatus = null;
      // 1. 获取设备图表 kv/current/symbol
      const { data } = await PluginAPI.equip({ entity_id: boatData.device_id })
      if (data?.data && data.data[0]) {
        let properties = data.data[0];
        lastPushTime = properties?.systime || "" ;
        // 当前值DOM
        currentDOM = `<div style="line-height:30px;">`;
        Object.keys(properties).forEach(key => {
          if (key !== "systime" && key !== "SYS_ONLINE") {
            currentDOM += `<div><span style="font-weight:bold;">${ key }：</span>${properties[key]}</div>`
          }
        })
        currentDOM += `</div>`;
      }

      // 2. 获取设备在线/离线状态
      let idList = { "device_id_list": [ boatData.device_id ] };
      const res = await this.getEquipStatus(idList);
      if (res.data.code == 200) {
        deviceStatus = res.data.data[boatData.device_id];
      }

      let switchContent = ''

        // 开关
        // switchContent = `
        // <div style="line-height:30px;display:flex;justify-content:space-between;align-items:center">
        //   <span style="font-weight:bold;">开关控制: </span>
        //   <input type="checkbox">
        // </div>`
        // <!--button id="${boatData?.device_id}" class="control" onclick="handleSwitch('${boatData?.device_id}')">开关</button> -->

      // 设备内容
      let equipStatus = boatData.equipStatus === '1' ? '<div style="margin-left:20px; color:#28a745; font-weight:bold;">在线</div>'
        : '<div style="margin-left:20px; color:#888; font-weight:bold;">离线</div>'
      const equipContent = `<div class="window-box" style="display: flex;flex-direction: column;
            justify-content: space-between; white-space: nowrap;min-width: 240px;border-radius:6px; background: #fff;padding:12px;box-shadow:3px 5px 3px #ccc; font-size:15px">
             <div style="line-height:30px;display:flex;justify-content:space-between">
               <div><span style="font-weight:bold;">项目名：</span>${boatData?.business_name}</div>
               <div style="margin-left:20px"><span style="font-weight:bold;">设备名：</span>${boatData?.device_name}</div>
             </div> 
             ${currentDOM}
             ${switchContent}
             <div style="line-height:30px;display:flex;justify-content:space-between">
              <div style="margin-right: 20px"><span style="font-weight:bold;">数据更新时间：</span>${ lastPushTime }</div>
              ${deviceStatus == "1" ? "在线" : "离线"}
            </div>
           </div>`

      windows.push({
        position: boatData.location?.split(','),
        visible: true,
        offset: [10, -30],
        showShadow: true,
        content: equipContent,
      })
      this.boatWindows = windows
    }
  }
};
</script>

<style lang="scss">
.amap-page-container {
  overflow: hidden;
}

.amap_box {
  margin-top: -100px;
  height: 100vh !important;
}

.p-4 {
  padding: 0 !important;
}

.aa {
  z-index: 999;
  background-color: transparent !important;
}

.amap-controls {
  position: relative;
  top: 100px;
}

.amap-geo {
  display: none;
}

.address-wrapper {
  display: flex;
  flex-direction: column;
}

.amap-box {
  flex: 1;
  height: 100vh;
}

.label-info {
  position: absolute;
  z-index: 2;
  border: 1px solid #fff;
  background-color: #5867dd !important;
  white-space: nowrap;
  border-radius: 4px;
  cursor: default;
  padding: 8px;
  font-size: 14px;
  line-height: 20px;
  color: #fff;
  margin-left: -2px;
  font-weight: bold;
}

.screen {
  &-btn {
    padding: 11px 20px;
  }

  &-nav {
    width: 100%;
    margin-top: 20px;
    margin-left: 20px;
  }
}

.control {
  border: 1px solid #ccc;
  font-size: 12px;
  padding: 0 10px;
}

.window-box {
  input[type="checkbox"] {
    appearance: none;
    width: 37px;
    height: 18px;
    position: relative;
    border-radius: 8px;
    cursor: pointer;
    background-color: #bfbfbf;
  }

  input[type="checkbox"]:before {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    background: #fff;
    left: 2px;
    top: 1px;
    border-radius: 50%;
    transition: left cubic-bezier(0.3, 1.5, 0.7, 1) 0.3s;
  }

  input[type="checkbox"]:after {
    position: absolute;
    top: 1px;
    content: "开 关";
    text-indent: 3px;
    word-spacing: -1px;
    display: inline-block;
    white-space: nowrap;
    color: #fff;
    font: 8px/16px monospace;
    font-weight: bold;
  }

  input[type="checkbox"]:checked {
    background-color: #5867dd;
  }

  input[type="checkbox"]:checked:before {
    left: 19px;
  }

  input[type="checkbox"]:checked:after {
    color: #fff;
  }
}
</style>