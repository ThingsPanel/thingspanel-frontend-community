<script>
import { onMounted, reactive, toRefs, watch } from 'vue';
import AMapLoader from '@amap/amap-jsapi-loader';

export default {
  // isMarkerShow 是否使用标记点
  props: ['keywords', 'keyAddress', 'isMarkerShow', 'lnglatArr', 'dimension', 'districts'],
  emits: ['locationValue', 'lnglatArr', 'subcomponent'],
  setup(props, context) {
    const state = reactive({
      newKeyAddress: props.keyAddress,
      conheight: {
        height: '1000px',
        width: ''
      },
      map: null,
      marker: null,
      // 默认维度

      dimension: props.dimension,
      // 新维度
      newdimension: [],

      lnglatArr: props.lnglatArr, // 多边形需要的数据
      districts: props.districts
    });
    const methods = {
      sweepAway() {
        state.lnglatArr = [];
        state.newKeyAddress = '';
        methods.mapInit();
      },
      mapInit(type, data) {
        console.log(111111, data);
        state.newKeyAddress = '';
        AMapLoader.load({
          key: '5c842e97cdff04d92eb472cf4a4860b2',
          version: '2.0',
          plugins: ['AMap.ToolBar', 'AMap.PlaceSearch', 'AMap.Geolocation', 'AMap.Geocoder']
        })
          .then(AMap => {
            state.map = new AMap.Map('container', {
              center: type,
              resizeEnable: true,
              zoom: 12,
              lang: 'cn'
            });
            if (data) {
              // 区域范围
              state.lnglatArr = JSON.parse(data.scope);
              let polygon = ''; // 定义多边形
              polygon = new AMap.Polygon({
                path: state.lnglatArr, // 设置多边形边界路径
                strokeColor: '#FF33FF', // 线颜色
                strokeOpacity: 0.2, // 线透明度
                strokeWeight: 3, // 线宽
                fillColor: '1791fc', // 填充色
                fillOpacity: 0.35 // 填充透明度
              });
              state.map.add(polygon);
              // 自动缩放并聚焦合适中心点
              state.map.setFitView([polygon]);

              /** 空间下区域范围 */
              if (data.districts) {
                let path = [];
                // let paths = [];
                let polygons = ''; // 定义多边形
                data.districts.map(item => {
                  path = JSON.parse(item.scope);
                  polygons = new AMap.Polygon({
                    path, // 设置多边形边界路径
                    strokeColor: '#FF33FF', // 线颜色
                    strokeOpacity: 0.2, // 线透明度
                    strokeWeight: 3, // 线宽
                    fillColor: 'pink', // 填充色
                    fillOpacity: 0.35 // 填充透明度
                  });
                  return state.map.add(polygons);
                });
              }
              /** 坐标 */
              if (data.districts.length > 0) {
                const coordinates = [];
                data.districts.map((item, index) => {
                  console.log(item);
                  coordinates.push(item.location.split(','));
                  state.marker = new AMap.Marker({
                    position: [coordinates[index][0], coordinates[index][1]],
                    map: state.map
                  });
                  state.marker.on('click', markerClick);

                  function markerClick() {
                    context.emit('subcomponent', item);
                  }

                  return undefined;
                });
              } else {
                const coordinates = data.location.split(',');
                console.log('data', data);
                console.log('coordinates', coordinates);

                state.marker = new AMap.Marker({
                  position: [coordinates[0], coordinates[1]],
                  map: state.map
                });
                state.marker.on('click', markerClick);

                // eslint-disable-next-line no-inner-declarations
                function markerClick() {
                  context.emit('subcomponent', data);
                }
              }
            }
          })
          .catch(e => {
            console.log(e);
          });
      }
    };
    watch(
      () => props.keywords,

      () => {
        const newArr = props.keywords.split(',');
        if (newArr.length > 1) {
          state.newdimension = newArr.map(item => {
            return item - 0;
          });
          methods.mapInit(state.newdimension, state.lnglatArr);
        } else {
          methods.mapInit(state.dimension, state.lnglatArr);
        }
      },
      { immediate: true }
    );

    onMounted(() => {
      methods.mapInit(state.dimension);
    });
    return { ...methods, ...toRefs(state) };
  }
};
</script>

<template>
  <div class="mapContainer1">
    <div id="container" style="height: 1080px"></div>
  </div>
</template>

<style scoped lang="scss">
.mapContainer1 {
  width: 100%;
  position: fixed;
  top: 100px;

  .searchInfo {
    display: flex;
    width: 15%;
    position: absolute;
    top: 20px;
    left: 35%;
    z-index: 99;

    input {
      width: 100%;
      padding-left: 10px;
    }
  }

  :deep(.amap-marker) {
    transform: translate(-10px, -10px) scale(1) rotate(0deg) !important;
  }
}

.particulars {
  display: flex;
}

.search-criteria {
  width: 50%;
  height: 100%;
}

.search {
  display: flex;
}

.search-input {
  margin-right: 15px;
}

.collapse {
  margin-top: 15px;
}

.device-type {
  display: flex;
  margin-top: 15px;
}

.type {
  margin-right: 15px;
}

.search-box {
  width: 50%;
  height: 100%;
}

.type-lf {
  width: 40%;
  margin-right: 10%;
  height: 100%;
}

.type-rg {
  width: 40%;
  height: 100%;
}

.add-space {
  width: 50%;
}

.test-box {
  padding: 10px;
}

.test-box:hover {
  color: rgb(47, 16, 189);
  cursor: pointer;
}
</style>
