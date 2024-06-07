<script>
import { onMounted, reactive, toRefs } from 'vue';
import { useMessage } from 'naive-ui';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useNaiveForm } from '@/hooks/common/form';
import { apaceDetail, editSpaces } from '@/service/api/equipment-map';

export default {
  props: ['dataId', 'buttonDisabled'],

  setup(props, context) {
    const state = reactive({
      newKeyAddress: '',
      conheight: {
        height: '1000px',
        width: ''
      },
      map: null,
      marker: null,
      // 默认维度
      dimension: [121.50861, 31.25141],
      // 新维度
      newdimension: [],
      lnglatArr: [], // 多边形需要的数据

      spaceForm: {
        name: '',
        spaces_id: '',
        sort: 1,
        location: '', // 经度
        dimensionality: '', // 维度
        scope: '',
        description: ''
      },
      rules: {
        name: {
          required: true,
          trigger: ['blur', 'input'],
          message: $t('common.addSuccess')
        }
      },
      locationData: false, // 设置位置判断
      rangeSetting: false, // 设置范围信息
      positionCoordinates: [],
      buttonData: 'primary',
      parameterId: props.dataId,
      locationDatas: [],
      FirstLoad: true,
      spinShow: false,
      buttonDisabled: props.buttonDisabled
    });
    const message = useMessage();
    const { formRef } = useNaiveForm();

    const methods = {
      /** 获取详情 */
      apaceDetails() {
        state.spinShow = true;
        apaceDetail(state.parameterId).then(e => {
          console.log('查询详情', e);
          if (e.data) {
            state.locationDatas = e.data.location.split(',');
            state.spaceForm.name = e.data.name;
            state.spaceForm.location = state.locationDatas[0];
            state.spaceForm.dimensionality = state.locationDatas[1];
            state.spaceForm.description = e.data.description;
            if (e.data.scope) {
              state.spaceForm.scope = JSON.parse(e.data.scope);
            }

            state.spinShow = false;
            methods.mapInit();
          }
        });
      },
      /** 取消保存 */
      closeModal() {
        state.spaceForm.name = '';
        state.spaceForm.location = '';
        state.spaceForm.dimensionality = '';
        state.spaceForm.description = '';
        state.lnglatArr = [];
        state.positionCoordinates = [];
        state.newKeyAddress = '';
        state.locationData = false;
        state.rangeSetting = false;
        state.buttonData = 'primary';
        methods.mapInit();
        context.emit('editAdd', false);
      },
      /** 编辑接口 */
      edit() {
        const data = {
          id: state.parameterId,
          name: state.spaceForm.name,
          sort: state.spaceForm.sort,
          location: `${state.spaceForm.location},${state.spaceForm.dimensionality}`,
          scope: state.spaceForm.scope,
          description: state.spaceForm.description
        };
        console.log('空间保存', data);
        editSpaces(data).then(e => {
          if (e) {
            message.success($t('common.editSuccess'));
            state.spaceForm.name = '';
            state.spaceForm.location = '';
            state.spaceForm.dimensionality = '';
            state.spaceForm.description = '';
            state.lnglatArr = [];
            state.positionCoordinates = [];
            state.newKeyAddress = '';
            state.locationData = false;
            state.rangeSetting = false;
            methods.mapInit();
            context.emit('saveSpace', false);
          } else {
            message.error($t('common.editFail'));
          }
        });
      },
      /** 保存 */
      handleReset(e) {
        console.log('保存', state.spaceForm.location);

        e.preventDefault();
        formRef.value?.validate(errors => {
          if (state.spaceForm.location > 0) {
            if (!errors) {
              console.log('验证成功');
              methods.edit();
            } else {
              console.log('验证失败');
            }
          } else {
            state.buttonData = 'error';
            message.error($t('generate.spaceLocation'));
          }
        });
      },
      sweepAway() {
        state.lnglatArr = [];
        state.newKeyAddress = '';
        methods.mapInit();
      },
      /**
       * 设置位置
       *
       * @param {any} type
       */
      locationSetting() {
        state.locationData = true;
        state.rangeSetting = false;
        state.FirstLoad = false;
        state.locationDatas = [];
        state.spaceForm.scope = [];
        state.spaceForm.location = '';
        state.spaceForm.dimensionality = '';
        methods.mapInit();
      },
      /**
       * 设置范围
       *
       * @param type
       */
      rangeSettingClick() {
        state.rangeSetting = true;
        state.locationData = false;
      },
      mapInit(type) {
        state.newKeyAddress = '';
        console.log('state.spaceForm.scope', state.spaceForm.scope);
        AMapLoader.load({
          key: '5c842e97cdff04d92eb472cf4a4860b2',
          version: '2.0',
          plugins: ['AMap.ToolBar', 'AMap.PlaceSearch', 'AMap.Geolocation', 'AMap.Geocoder']
        })
          .then(AMap => {
            console.log('AMap', AMap);
            state.map = new AMap.Map('containerEdit', {
              center: type,
              resizeEnable: true,
              zoom: 12,
              lang: 'cn'
            });
            if (state.FirstLoad) {
              /** 显示空间范围 */

              let polygon = ''; // 定义多边形
              polygon = new AMap.Polygon({
                path: state.spaceForm.scope, // 设置多边形边界路径
                strokeColor: '#FF33FF', // 线颜色
                strokeOpacity: 0.2, // 线透明度
                strokeWeight: 3, // 线宽
                fillColor: '1791fc', // 填充色
                fillOpacity: 0.35 // 填充透明度
              });
              state.map.add(polygon);
              // 自动缩放并聚焦合适中心点
              state.map.setFitView([polygon]);
              if (state.locationDatas) {
                const marker = new AMap.Marker({
                  position: new AMap.LngLat(state.spaceForm.location, state.spaceForm.dimensionality) // 经纬度对象
                });
                state.map.add(marker);
              }
            } else {
              /** 设置位置获取坐标 */
              /** 设置位置获取坐标 */
              // eslint-disable-next-line no-inner-declarations
              function locationDataClick(e) {
                if (state.locationData) {
                  state.spaceForm.location = String(e.lnglat.lng);
                  state.spaceForm.dimensionality = String(e.lnglat.lat);
                  state.buttonData = 'primary';
                  if (state.marker) {
                    state.map.remove(state.marker);
                  }
                  state.marker = new AMap.Marker({
                    position: new AMap.LngLat(e.lnglat.lng, e.lnglat.lat), // 经纬度对象
                    map: state.map
                  });
                }
              }

              state.map.on('click', locationDataClick); // 点击划图
              /** 设置范围 */

              // eslint-disable-next-line no-inner-declarations
              function showInfoClick(e) {
                console.log(9999999999, state.rangeSetting);
                if (state.rangeSetting) {
                  let polygon = ''; // 定义多边形
                  polygon = new AMap.Polygon({
                    path: state.lnglatArr, // 设置多边形边界路径
                    strokeColor: '#FF33FF', // 线颜色
                    strokeOpacity: 0.2, // 线透明度
                    strokeWeight: 3, // 线宽
                    fillColor: '1791fc', // 填充色
                    fillOpacity: 0.35 // 填充透明度
                  });
                  state.lnglatArr.push(e.lnglat);
                  const icon = new AMap.Icon({
                    imageOffset: new AMap.Pixel(0, -60), // 图像相对展示区域的偏移量，适于雪碧图等
                    imageSize: new AMap.Size(20, 20), // 根据所设置的大小拉伸或压缩图片
                    image: new URL('../../../assets/svg-icon/AdjustRound.svg', import.meta.url).href
                  });
                  const marker = new AMap.Marker({
                    position: new AMap.LngLat(e.lnglat.lng, e.lnglat.lat), // 经纬度对象
                    icon
                  });
                  state.spaceForm.scope = JSON.stringify(state.lnglatArr);
                  state.map.add(marker);
                  if (state.lnglatArr.length > 1) {
                    state.map.remove(polygon);
                  }

                  state.map.add(polygon); // 生成多边形
                }
              }

              state.map.on('click', showInfoClick); // 范围
              state.map.setFitView(); // 根据地图上添加的覆盖物分布情况，自动缩放地图到合适的视野级别
            }

            // eslint-disable-next-line func-names
            AMap.plugin(['AMap.AutoComplete', 'AMap.PlaceSearch'], function () {
              const autoOptions = {
                input: 'editInput'
              };
              const autocomplete = new AMap.Autocomplete(autoOptions);
              const placeSearch = new AMap.PlaceSearch({
                city: '上海',
                map: state.map
              });

              // eslint-disable-next-line func-names
              AMap.Event.addListener(autocomplete, 'select', function (e) {
                context.emit('locationValue', e.poi);
                placeSearch.search(e.poi.name);
              });
            });
          })
          .catch(e => {
            console.log(e);
          });
      }
    };

    onMounted(() => {
      console.log('props111111', props.dataId);
      methods.apaceDetails();
    });
    return { ...methods, ...toRefs(state), formRef };
  }
};
</script>

<template>
  <div class="mapContainer">
    <div class="searchInfo">
      <input
        id="editInput"
        v-model="newKeyAddress"
        :placeholder="$t('generate.enter-keyword')"
        class="input-with-select"
      />

      <div class="add-box">
        <NCard>
          <n-spin :show="spinShow">
            <NForm ref="formRef" label-placement="left" :model="spaceForm" :rules="rules">
              <NGrid :cols="1" :x-gap="18">
                <NFormItemGridItem :span="16" :label="$t('generate.space-name')" path="name">
                  <NInput v-model:value="spaceForm.name" />
                </NFormItemGridItem>

                <NFormItemGridItem :span="18" :label="$t('generate.space-location')" class="whitespace-nowrap">
                  <n-button :type="buttonData" :disabled="buttonDisabled" @click="locationSetting">
                    {{ $t('generate.edit-location') }}
                  </n-button>
                  <span class="required-span">*</span>
                </NFormItemGridItem>
                <NFormItemGridItem :label="$t('generate.location-information')" class="whitespace-nowrap" :span="18">
                  <span>{{ $t('generate.longitude') }}</span>
                  :
                  <NInput v-model:value="spaceForm.location" disabled />
                  <span>{{ $t('generate.latitude') }}</span>
                  :
                  <NInput v-model:value="spaceForm.dimensionality" disabled />
                </NFormItemGridItem>
                <NFormItemGridItem :span="16" :label="$t('generate.map-range')" path="scope">
                  <n-button :disabled="buttonDisabled" @click="rangeSettingClick">
                    {{ $t('generate.set-range') }}
                  </n-button>
                </NFormItemGridItem>
                <NFormItemGridItem :span="16" :label="$t('generate.location-details')" path="description">
                  <NInput v-model:value="spaceForm.description" type="textarea" placeholder="" />
                </NFormItemGridItem>
              </NGrid>
              <NSpace class="w-full pt-16px" :size="24" justify="center">
                <NButton class="w-72px" @click="closeModal">{{ $t('generate.cancel') }}</NButton>
                <NButton class="w-72px" type="primary" @click="handleReset">{{ $t('common.save') }}</NButton>
              </NSpace>
            </NForm>
          </n-spin>
        </NCard>
      </div>
    </div>

    <div id="containerEdit" style="height: 1080px"></div>
  </div>
</template>

<style scoped lang="scss">
.mapContainer {
  width: 100%;
  position: relative;

  .searchInfo {
    display: flex;
    justify-content: space-between;
    width: 50%;
    position: absolute;

    top: 20px;
    right: 20px;
    z-index: 99;

    input {
      width: 300px;
      padding-left: 10px;
    }
  }
}

:deep(.amap-marker) {
  transform: translate(-10px, -10px) scale(1) rotate(0deg) !important;
}

.add-box {
  width: 400px;
  position: absolute;
  right: 0;
  opacity: 0.9;
}

.required-span {
  margin-left: 10px;
  color: red;
}
</style>
