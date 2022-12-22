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
          <DeviceGroupSelector @change="handleGroupChange" :asset_id.sync="params.asset_id" :business_id.sync="params.business_id">
          </DeviceGroupSelector>
        </el-col>
        <el-col :span="4">
          <el-cascader
            placeholder="请选择设备插件"
            v-model="pluginId"
            size="medium"
            :options="optionsList"
            class="w-100"
        >
        </el-cascader>
        </el-col>
        <el-col :span="12">
          <el-button icon="el-icon-full-screen " @click='btn'
            class="btn el-button--default el-button mr-2 el-button--indigo el-button--medium">全屏</el-button>

        </el-col>
      </el-row>
      <div :style="{ width: '100%', height: '900px' }" :class='{ amap_box: bindc }'>
        <el-amap vid="amap" :plugin="plugin" class="amap-demo" :center="center" ref="centerMap">
          <el-amap-marker v-for="(marker, index) in markers" :key="'marker' + index" :position="marker"> </el-amap-marker>
          <!-- <el-amap-info-window
          :position="window.position"
          :visible="true"
          :content="window.content"
          :offset="window.offset"
          :close-when-click-map="true"
          :is-custom="true"
        >
          <div id="info-window">
            <p>{{ window.address }}</p>
            <div class="detail" @click="checkDetail">查看详情</div>
          </div>
        </el-amap-info-window> -->
        </el-amap>
      </div>
    </div>
    <!-- 点标记 111-->
    <div class="map_address">
      <div class="address-wrapper" :style="{ width: '100%', height: '100%' }">

        <!-- <el-amap vid="amap" class="amap-demo" :amap-manager="amapManager" :plugin="plugin" :events="events"
          :center="center" :zoom="zoom">
     
          <el-amap-marker v-for="(marker, index) in markers" :key="'marker' + index" :position="marker.position"> </el-amap-marker>
        </el-amap> -->
      </div>
    </div>
    <!--  -->
    <!-- 信息窗口 -->
    <el-amap-info-window
          v-if="window"
          :position="window.position"
          :visible="window.visible"
          :content="window.content"
          :offset="window.offset"
          :close-when-click-map="true"
          :is-custom="true"
        >
          <div id="info-window">
            <p>{{ window.address }}</p>
            <div class="detail" @click="checkDetail">查看详情</div>
          </div>
        </el-amap-info-window>
    <!--  -->
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
let Geocoder;

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
            console.log(this.optionsList)
          }
        })
    },
    // 设备地图
    getEquipMap() {
      let vue = this
      PluginAPI.map(this.queryParams) 
        .then(({data}) => {
          let res = data.data
          vue.markers.push({
            center: res.location,
            bounds: [100, 100]
          })
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
        if(e.device_model) {
          e.children = e.device_model
          this.formatterOption(e.children)
        }
      })
      return data
    },
    btn() {
      this.bindc = !this.bindc;
      let element = document.getElementById("screen"); //指定全屏区域元素
      screenfull.toggle(element); //全屏显示
      let aa = document.querySelector('.aa')
      aa.style.position = 'absolute'
    },
    onSearchResult(pois) {
      console.log(pois)
      this.input = document.querySelector('.search-box-wrapper input').value
      this.center = [pois[0].lng, pois[0].lat]        //选择了第一个值
      this.markers = [];    //标记点先清空  
      this.markers.push([pois[0].lng, pois[0].lat])   //把搜索的位置的第一个值存入标记中并显示标记点
      console.log(this.markers);
    },
    point() {
      const markers = [];
      const windows = [];
      const that = this;
      this.data.forEach((item, index) => {
        markers.push({
          position: item.position.split(","),
          // icon:item.url, //不设置默认蓝色水滴
          visible: true,
          events: {
            click() {
              // 方法：鼠标移动到点标记上，显示相应窗体
              that.windows.forEach((window) => {
                window.visible = false; // 关闭窗体
              });
              that.window = that.windows[index];
              that.$nextTick(() => {
                that.window.visible = true;
              });
            },
          },
        });
        windows.push({
          position: item.position.split(","),
          isCustom: true,
          offset: [115, 55], // 窗体偏移
          showShadow: false,
          visible: true, // 初始是否显示
          address: item.address,
        });
      });
      //  加点
      this.markers = markers;
      // 加弹窗
      this.windows = windows;
    },
  },
  created (){
    this.getPluginList()
    // this.point()
  },
  mounted() {
    this.point()
  },
  data() {
    const self = this;
    return {
      data: [
        {
          position: "113.645422,34.730936",
          address: "另一个地址",
        },
        {
          position: "113.685313,34.746453",
          address: "一个地址",
        },
      ],
      params: {
        business_id: ""
      },
      queryParams: {
        group_id: "aa93360c-d864-9033-88b7-9d34e63517a2"
      },
      pluginId: '',
      optionsList: [],
      markers: [],
      zoom: 10,
      input: '',
      amapManager,
      searchOption: {
        city: "全国",
        citylimit: false,
      },
      marker: [],
      windows: [],
      window: "",
      events: {
        init: (o) => {
          o.getCity((result) => {
            console.log(result)
          })
        },
        click: (e) => {
          self.center = [e.lnglat.lng, e.lnglat.lat];
          console.log(self.center)
          self.markers = [];
          self.markers.push(self.center)
          Geocoder.getAddress(self.center, function (status, result) { //根据坐标获取位置
            if (status === "complete" && result.info === "OK") {
              console.log(result.regeocode.formattedAddress)
              self.input = result.regeocode.formattedAddress;
              document.querySelector(".search-box-wrapper input").value = self.input;
            }
          })
        }
      },
      bindc: true,
      center: [113.645422, 34.730936],
      lng: 0,
      lat: 0,
      loaded: false,
      plugin: [
        {
          pName: "MapType",
          defaultType: 0, // 初始化默认图层类型。 取值为0：默认底图 取值为1：卫星图 默认值：0
          showTraffic: false,
          showRoad: true,
        },
        {
          // 工具栏
          pName: "ToolBar",
          events: {
            init(instance) {
              // console.log(instance);
            },
          },
        },
        {
          enableHighAccuracy: true, //是否使用高精度定位，默认:true
          timeout: 100, //超过10秒后停止定位，默认：无穷大
          maximumAge: 0, //定位结果缓存0毫秒，默认：0
          convert: true, //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
          showButton: true, //显示定位按钮，默认：true
          buttonPosition: "RB", //定位按钮停靠位置，默认：'LB'，左下角
          showMarker: true, //定位成功后在定位到的位置显示点标记，默认：true
          showCircle: true, //定位成功后用圆圈表示定位精度范围，默认：true
          panToLocation: true, //定位成功后将定位到的位置作为地图中心点，默认：true
          zoomToAccuracy: true, //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：f
          extensions: "all",
          pName: "Geolocation",
          events: {
            init(o) {
              // o 是高德地图定位插件实例
              o.getCurrentPosition((status, result) => {
                if (result && result.position) {
                  self.lng = result.position.lng;
                  self.lat = result.position.lat;
                  self.center = [self.lng, self.lat];
                  self.loaded = true;
                  self.$nextTick();
                  // 111
                  self.markers.push(self.center)
                  self.zoom = 14;
                  // 
                }
              });
            },
          },
        },
        // {
        //   pName: "Geocoder",
        //   events: {
        //     init: (o) => {
        //       Geocoder = o; // o 则是AMap.Geocoder的实例 对外部的Geocoder变量进行赋值，在任何地方就都可以使用
        //       //data里的events中使用了Geocoder
        //       o.getAddress(self.center, function (status, result) { //根据坐标获取位置
        //         if (status === "complete" && result.info === "OK") {
        //           self.input = result.regeocode.formattedAddress;
        //           document.querySelector(".search-box-wrapper input").value = self.input;
        //         }
        //       })
        //     }
        //   }
        // }
        // // 
      ],
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
  height: 1000px !important;
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


// 
.address-wrapper {
  display: flex;
  flex-direction: column;
}

.amap-demo {
  flex: 1;
  height: 100vh;
}
</style>