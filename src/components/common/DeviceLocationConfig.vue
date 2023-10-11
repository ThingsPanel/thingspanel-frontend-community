<template>
  <el-dialog top="5vh" :append-to-body="true" :title="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICE_LOCATION.GET_MAP_LOCATION')" :visible.sync="dialogVisible" :before-close="handleClose"
    width="1000px">
    <div class="amap-page-container">
      <el-row style="margin-bottom: 20px;" :gutter=20 type="flex" align="middle"  justify="center">
        <el-col :span=9>
          <el-amap-search-box class="search-box" :search-option="searchOption" :on-search-result="onSearchResult" />
          
        </el-col>
        <el-col :span=12 style="color: white; height: 100%">
          <div class="toolbar" style="color: white; height: 100%">
            <div>
            {{ $t("DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICE_LOCATION.CURRENT_COORDINATE") }}: {{ lng }}, {{ lat }}
              
            </div>
            <div>
            {{ $t("DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICE_LOCATION.CURRENT_LOCATION") }}: {{ address }}
              
            </div>
          </div>
        </el-col>
        <el-col :span=3>
          <el-button type="primary" @click="select">{{ $t("COMMON.CONFIRM") }}</el-button>
        </el-col>
      </el-row>
      <el-amap vid="amap" :amap-manager="amapManager" :plugin="plugin" class="amap-box" :center="center" ref="centerMap"
        :zoom="zoom" viewMode="3D" :events="events">
        <el-amap-marker v-for="(marker, index) in markers" :key="index" :position="marker.position" />
      </el-amap>

    </div>
  </el-dialog>
</template>

<script type="text/javascript">
window._AMapSecurityConfig = {
  securityJsCode: '0e3695afbd6670b268044894df285dde'
}
</script>
<script>
import { AMapManager } from "vue-amap"
let amapManager = new AMapManager();
export default {
  name: 'DeviceLocationConfig',
  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    },
    makerPosition: {
      type: Array,
      default: () => {
        return [121.59996, 31.197646]
      }
    }
  },
  data: function () {
    const self = this
    return {
      zoom: 7,
      center: [121.59996, 31.197646],
      amapManager,
      address: '',
      cityCode: '',
      searchOption: {
        city: '上海',
        citylimit: false
      },
      mapCenter: [121.59996, 31.197646],
      markers: [],
      plugin: [{
        pName: 'ToolBar',
        events: {
          init(instance) {
          }
        }
      },
      {
        pName: 'Geolocation',
        events: {
          init(o) {
            console.error("init geolocation")
            // o 是高德地图定位插件实例
            o.getCurrentPosition((status, result) => {
              console.error(result, status, "getCurrentPosition")
              if (result && result.position) {
                // 如果key是企业的，还可以直接result.addressComponent获取省市，周边等信息

                console.log(result);
                self.address = result.formattedAddress;
                self.center = [result.position.lng, result.position.lat];
                self.loaded = true;
                self.$nextTick();
                
                self.lng = result.position.lng
                self.lat = result.position.lat
              }
            });
          }
        }
      },
    ],
      events: {
        click(e) {
          const { lng, lat } = e.lnglat
          self.lng = lng
          self.lat = lat
          self.markers[0] = {
            position: [lng, lat]
          }

          // 这里通过高德 SDK 完成。
          var geocoder = new AMap.Geocoder({
            radius: 1000,
            extensions: 'all'
          })
          geocoder.getAddress([lng, lat], function (status, result) {
            if (status === 'complete' && result.info === 'OK') {
              if (result && result.regeocode) {
                self.address = result.regeocode.formattedAddress
                self.$nextTick()
              }
            }
          })
        }
      },
      lng: 0,
      lat: 0
    }
  },
  created() {
    this.mapCenter = this.makerPosition
    this.lng = this.makerPosition[0]
    this.lat = this.makerPosition[1]
  },
  methods: {
    onSearchResult(pois) {
      let latSum = 0
      let lngSum = 0
      if (pois.length > 0) {
        pois.forEach(poi => {
          const { lng, lat } = poi
          lngSum += lng
          latSum += lat
        })
        const center = {
          lng: lngSum / pois.length,
          lat: latSum / pois.length
        }
        this.mapCenter = [center.lng, center.lat]
      }
    },
    handleClose(done) {
      this.$emit('update:dialogVisible', false)
      this.$nextTick(() => {
        done()
      })
    },
    select() {
      this.$emit('update:dialogVisible', false)
      this.$emit('update:makerPosition', this.markers[0].position)
    }
  }

}
</script>
  
<style lang="scss" scoped>
.amap-box {
  height: 450px;
}

.search-box {
  z-index: 999;
  // margin-bottom: 20px;
}

.amap-page-container {
  position: relative;
}
</style>