<template>
  <div class="amap-page-container rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
      <el-col>
        <TableTitle>{{ $t("COMMON.ECHARTS") }}</TableTitle>
      </el-col>
    </el-row>

    <div id="screen">
      <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input aa">
        <el-col :span="4">
          <BusinessSelector :business_id.sync="params.business_id"></BusinessSelector>
        </el-col>
        <el-col :span="4">
          <DeviceGroupSelector @change="handleGroupChange" :asset_id.sync="params.asset_id"
            :business_id.sync="params.business_id">
          </DeviceGroupSelector>
        </el-col>
        <el-col :span="4">
          <el-cascader placeholder="请选择设备插件" v-model="pluginId" size="medium" :options="optionsList" class="w-100">
          </el-cascader>
        </el-col>
        <el-col :span="12">
          <el-button icon="el-icon-full-screen " @click='btn'
            class="btn el-button--default el-button mr-2 el-button--indigo el-button--medium">全屏</el-button>

        </el-col>
      </el-row>
      <div :style="{ width: '100%', height: '100vh' }" :class='{ amap_box: bindc }'>
        <el-amap vid="amap" class="amap-box" v-bind="mapConfig" viewMode="3D">

          <el-amap-marker v-for="(marker, index) in markers" :position="marker.position" :vid="index"
            :content="marker.content" :label="marker.label" :events="marker.events"></el-amap-marker>

          <el-amap-info-window v-for="boatWindow in boatWindows" :position="boatWindow.position"
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

export default {
  components: {
    TableTitle,
    BusinessSelector,
    DeviceGroupSelector
  },
  methods: {
    // 获取插件列表
    getPluginList() {
      PluginAPI.tree({})
        .then(({ data }) => {
          if (data.code == 200) {
            this.optionsList = JSON.parse(JSON.stringify(this.formatterOption(data.data)))
            this.renderMarks(this.optionsList)
          }
        })
    },
    // 设备地图
    getEquipMap() {
      let vm = this
      PluginAPI.map(this.queryParams)
        .then(({ data }) => {
          let res = data.data
          if (res[0].location) {
            vm.createWindow(res[0], res[0].location.split(','))
          }
        })
    },
    // 设备分组选择
    handleGroupChange() {
      this.getEquipMap()
    },
    // 格式化插件tree返回数据
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
    // 初始化渲染所有设备
    renderMarks(dataList) {
      let deviceList = []
      let vm = this
      dataList.forEach(e => {
        deviceList = [...deviceList, ...e.children]
      });
      deviceList.forEach(e => {
        let params = {
          device_model_id: e.id
        }
        PluginAPI.map(params)
          .then(({ data }) => {
            let res = data.data?.filter(item => item.location)
            res?.forEach((el, index) => {
              vm.markers.push({
                position: el.location.split(","),
                label: {
                  content: `<div class="label-info">${el.business_name} - ${el.device_name}</div>`,
                  offset: [5, 20],
                  direction: 'bottom'
                },
                events: {
                  click() {
                    el.position = el.location.split(",")
                    vm.createWindow(el, el.position)
                  }
                }
              })
            })

            // 默认窗口
            if (res) {
              vm.createWindow(res[0], res[0]?.location.split(","))
            }

          })
      })
    },
    // 获取设备其他信息
    getEquipInfo() {
      PluginAPI.map(this.queryParams)
        .then(({ data }) => {
          let res = data.data
          if (res[0].location) {
            vm.createWindow(res[0], res[0].location.split(','))
          }
        })
    },
    // 创建点坐标
    createMark(el) {
      const vm = this
      vm.markers.push({
        position: el.location.split(","),
        label: {
          content: `<div class="label-info">${el.business_name} - ${el.device_name}</div>`,
          offset: [5, 20],
          direction: 'bottom'
        },
        events: {
          click() {
            el.position = el.location.split(",")
            vm.createWindow(el, el.position)
          }
        }
      })
    },
    // 全屏显示
    btn() {
      this.bindc = !this.bindc;
      let element = document.getElementById("screen"); //指定全屏区域元素
      screenfull.toggle(element); //全屏显示
      let aa = document.querySelector('.aa')
      aa.style.position = 'absolute'
    },
    // 创建信息窗体
    createWindow(boatData, lnglat) {
      const windows = []
      const vm = this
      // 设备内容
      const equipContent = `<div style="width: 330px;height: 115px;border-raduis:5px; background: #fff;padding:12px;box-shadow:3px 5px 3px #ccc; font-size:14px">
             <div style="line-height:21px;display:flex;justify-content:space-between"><span>项目名：${boatData.business_name}</span><span>设备名：${boatData.device_name}</span></div> 
             <div style="line-height:21px">温度：</div>
             <div style="line-height:21px">湿度：</div>
             <div style="line-height:21px;display:flex;justify-content:space-between">数据更新时间：${boatData.latest_ts}<span>在线/离线</span></div>
           </div>`
      const sensorContent = `<div style="width: 330px;height: 115px;background: #fff;padding:12px;box-shadow:3px 5px 2px 2px #ccc; font-size:14px">
             <div style="line-height:21px;display:flex;justify-content:space-between"><span>项目名：${boatData.business_name}</span><span>设备名：${boatData.device_name}</span></div> 
             <div style="line-height:21px;display:flex;justify-content:space-between">数据更新时间：${boatData.latest_ts}<span>在线/离线</span></div>
           </div>`

      windows.push({
        position: lnglat,
        visible: true,
        offset: [10, -30],
        showShadow: true,
        content: equipContent
      })
      this.boatWindows = windows
      // vm.boatWindow = windows[0]
    }
  },
  created() {
    this.getPluginList()
  },
  mounted() {

  },
  data() {
    return {
      params: {
        business_id: ""
      },
      queryParams: {
        group_id: "aa93360c-d864-9033-88b7-9d34e63517a2"
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
        amapManager,
      },
      // 设备插件列表
      optionsList: [],
      // 插件ID
      pluginId: '',
    };
  },

};
</script>

<style  lang="scss">
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
</style>