<template>
  <div class="amap-page-container rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3" >
      <el-col>
        <TableTitle>{{ $t("COMMON.ECHARTS") }}</TableTitle>
      </el-col>
    </el-row>

  <div id="screen" >
   <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input aa" >
      <el-col :span="4">
        <BusinessSelector></BusinessSelector>
      </el-col>
      <el-col :span="4">
        <BusinessSelector></BusinessSelector>
      </el-col>
      <el-col :span="4">
        <BusinessSelector></BusinessSelector>
      </el-col>
      <el-col :span="12" >
        <el-button icon="el-icon-full-screen " @click='btn' class="btn el-button--default el-button mr-2 el-button--indigo el-button--medium">全屏</el-button>

      </el-col>
    </el-row>
    <div :style="{ width: '100%', height: '900px' }" :class='{ amap_box:bindc }'>
      <el-amap
        vid="amap"
        :plugin="plugin"
        class="amap-demo"
        :center="center"
        ref="centerMap"
      >
      </el-amap>
    </div>
</div>
<!-- 点标记 111-->
<div class="map_address">
  <div class="address-wrapper" 
    :style="{width:'100%',height:'100%'}"
  >
     
      <el-amap 
        vid="amap" 
        class="amap-demo"  
        :amap-manager="amapManager" 
        :plugin="plugin"  
        :events="events"   
        :center="center" 
        :zoom="zoom"
      >
          <!-- 点标记在地图上显示的位置，默认为地图中心点， -->
        <el-amap-marker
          v-for="(marker,index) in markers"
          :key ="'marker'+index"
          :position ="marker" 
        > </el-amap-marker>
      </el-amap>
  </div>
</div>
<!--  -->
<!-- 信息窗口 -->
 
<!--  -->
  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle.vue";
import BusinessSelector from "@/components/common/BusinessSelector";
import screenfull from "screenfull";
// 111
import {AMapManager} from "vue-amap"
let amapManager= new AMapManager();
let Geocoder;    
// 
export default {
  
  components: {
    TableTitle,
    BusinessSelector,
  },
  // 窗口信息
 
  // 

  methods: {
    btn() {
      this.bindc = !this.bindc;
      let element = document.getElementById("screen"); //指定全屏区域元素
      screenfull.toggle(element); //全屏显示
      let aa = document.querySelector('.aa')
      aa.style.position = 'absolute'
      
    },
    // 111
     onSearchResult(pois){
        console.log(pois)     
        this.input = document.querySelector('.search-box-wrapper input').value 
        this.center = [pois[0].lng,pois[0].lat]        //选择了第一个值
        this.markers = [];    //标记点先清空  
        this.markers.push([pois[0].lng,pois[0].lat])   //把搜索的位置的第一个值存入标记中并显示标记点
        console.log(this.markers);
    },
      // 信息窗口方法
      
      // 
     
     
  },
 
  
    data() {
      const self = this;
      return {
        zoom: 17,
        input: '',
        amapManager,
            searchOption: {
              city: "全国",
              citylimit: false,
        },  
        marker: [],
             events:{
                init:(o)=>{
                  o.getCity((result)=>{
                    console.log(result)
                  })
                },
                click:(e)=>{
                  self.center = [e.lnglat.lng, e.lnglat.lat];
                  console.log(self.center)
                  self.markers=[];
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
        // 
        bindc: true,
        center: [121.599197, 31.205379],
        lng: 0,
        lat: 0,
        loaded: false,
        plugin: [
          {
            pName: "MapType",
            defaultType: 1,
            showTraffic: false,
            showRoad: true,
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
          // 111
          {
            pName: "Geocoder",
            events: {
              init: (o) => {
                Geocoder = o; // o 则是AMap.Geocoder的实例 对外部的Geocoder变量进行赋值，在任何地方就都可以使用
                //data里的events中使用了Geocoder
                o.getAddress(self.center, function (status, result) { //根据坐标获取位置
                  if (status === "complete" && result.info === "OK") {
                    self.input = result.regeocode.formattedAddress;
                    document.querySelector(".search-box-wrapper input").value = self.input;
                  }
                })
              }
            }
          }
          // 
        ],
      };
    },
  
};
</script>

<style  lang="scss">
 .amap_box{
  margin-top: -100px;
  height: 1000px !important;
 }
 .p-4{
  padding: 0 !important;
}
.aa{
  z-index: 999;
  background-color: transparent !important;
}

.amap-controls{
  position: relative;
  top: 100px;
}
.amap-geo{
  display: none;
}


// 
.address-wrapper{
  display:flex;
  flex-direction:column;
}
.amap-demo{
    flex:1;
    height:100vh;
}
</style>