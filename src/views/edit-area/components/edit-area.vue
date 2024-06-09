<script>
import { onMounted, reactive, toRefs } from 'vue';
import { useMessage } from 'naive-ui';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useNaiveForm } from '@/hooks/common/form';
import { areaData, editArea, spacesData } from '@/service/api/equipment-map';
import { $t } from '@/locales';

export default {
  props: ['dataId'],
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

      areaForm: {
        name: '',
        spaces_id: '',
        sort: 1,
        location: '',
        scope: '',
        image_url: '',
        description: '',
        remark: '',
        area: '',
        water_requirement: '',
        crop_type: '',
        soil_type: '',
        irrigation_type: '',
        dimensionality: ''
      },
      areaRules: {
        spaces_id: {
          required: true,
          trigger: ['blur', 'input'],
          message: $t('common.belongingSpace')
        },
        name: {
          required: true,
          trigger: ['blur', 'input'],
          message: $t('common.addSuccess')
        },
        location: {
          required: true,
          trigger: ['blur', 'change'],
          message: $t('generate.spaceLocation')
        }
      },
      locationData: false, // 设置位置判断
      rangeSetting: false, // 设置范围信息
      positionCoordinates: [],
      buttonData: 'primary',
      spaces: [],
      areaMap: [], // 设置空间范围坐标
      districts: [], // 已有空间范围
      parameterId: props.dataId,
      selected: ''
    });
    const message = useMessage();
    const { formRef } = useNaiveForm();
    const methods = {
      /** 详情接口 */
      edit() {
        areaData(state.parameterId).then(e => {
          console.log('查询详情', e);
          if (e.data) {
            state.locationData = e.data.location.split(',');
            state.areaForm = { ...e.data };
            state.areaForm.location = state.locationData[0];
            state.areaForm.dimensionality = state.locationData[1];
            state.areaForm.description = e.data.description;
            // eslint-disable-next-line no-eval
            state.areaForm.scope = JSON.parse(e.data.scope);
            console.log('查询详情11111', state.areaForm.scope);
            // eslint-disable-next-line array-callback-return
            state.spaces.map(item => {
              if (item.value === state.areaForm.space_id) {
                state.selected = item.value;
                console.log(787878, state.selected);
              }
            });
            methods.mapInit();
          }
        });
      },
      /** 选择空间 */
      async spacesList() {
        const name = { name: '' };

        const { data } = await spacesData(name);
        console.log('列表2222', data);
        if (data) {
          // eslint-disable-next-line array-callback-return
          data.list.map(item => {
            state.spaces.push({
              label: item.space_name,
              value: item.space_id,
              // eslint-disable-next-line no-eval
              scope: JSON.stringify(item.scope),
              districts: item.districts
            });
          });
        }
      },
      selectUpdate(e) {
        state.areaForm.spaces_id = e;
        // eslint-disable-next-line array-callback-return
        state.spaces.map(item => {
          if (item.value === e) {
            (state.lnglatArr = item.scope)((state.districts = item.districts));
            return state;
          }
          return undefined;
        });
        methods.mapInit();
        console.log(11111111, state.districts);
      },
      /** 取消保存 */
      closeModal() {
        state.areaForm.name = '';
        state.areaForm.location = '';
        state.areaForm.dimensionality = '';
        state.areaForm.description = '';
        state.lnglatArr = [];
        state.positionCoordinates = [];
        state.newKeyAddress = '';
        state.locationData = false;
        state.rangeSetting = false;
        state.buttonData = 'primary';
        methods.mapInit();
        context.emit('cancelEditArea', false);
      },

      editAreas() {
        const data = { ...areaForm };
        const id = editArea(data).then(e => {
          console.log(e);
        });
        console.log(id);
      },
      /** 保存 */
      addAreaClick(e) {
        console.log('保存', state.areaForm.location);

        e.preventDefault();
        formRef.value?.validate(errors => {
          if (state.areaForm.location > 0) {
            if (!errors) {
              console.log('验证成功');
              methods.add();
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
        console.log(1111111, state.lnglatArr);
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
        AMapLoader.load({
          key: '5c842e97cdff04d92eb472cf4a4860b2',
          version: '2.0',
          plugins: ['AMap.ToolBar', 'AMap.PlaceSearch', 'AMap.Geolocation', 'AMap.Geocoder']
        })
          .then(AMap => {
            console.log('AMap', AMap);
            state.map = new AMap.Map('containersEdit', {
              center: type,
              resizeEnable: true,
              zoom: 12,
              lang: 'cn'
            });

            /** 显示区域范围 */

            let polygon = ''; // 定义多边形
            polygon = new AMap.Polygon({
              path: state.areaForm.scope, // 设置多边形边界路径
              strokeColor: '#FF33FF', // 线颜色
              strokeOpacity: 0.2, // 线透明度
              strokeWeight: 3, // 线宽
              fillColor: '1791fc', // 填充色
              fillOpacity: 0.35 // 填充透明度
            });
            state.map.add(polygon);
            // 自动缩放并聚焦合适中心点
            state.map.setFitView([polygon]);
            const marker = new AMap.Marker({
              position: new AMap.LngLat(state.locationData[0], state.locationData[1]) // 经纬度对象
            });
            state.map.add(marker);
            // 区域范围
            let space = ''; // 定义多边形
            space = new AMap.Polygon({
              path: state.lnglatArr, // 设置多边形边界路径
              strokeColor: '#FF33FF', // 线颜色
              strokeOpacity: 0.2, // 线透明度
              strokeWeight: 3, // 线宽
              fillColor: '1791fc', // 填充色
              fillOpacity: 0.1 // 填充透明度
            });
            state.map.add(space);
            space.on('click', polylineClick);
            if (state.districts) {
              let pash = [];

              state.districts.map(item => {
                // eslint-disable-next-line no-eval
                pash = JSON.stringify(item.scope);
                let spaces = ''; // 定义多边形
                spaces = new AMap.Polygon({
                  path: pash, // 设置多边形边界路径
                  strokeColor: '#FF33FF', // 线颜色
                  strokeOpacity: 0.2, // 线透明度
                  strokeWeight: 3, // 线宽
                  fillColor: 'pink', // 填充色
                  fillOpacity: 0.5 // 填充透明度
                });
                return state.map.add(spaces);
              });
              console.log('state.districts', pash);
            }

            function polylineClick(e) {
              if (state.locationData) {
                state.positionCoordinates.push(e.lnglat);
                if (state.positionCoordinates.length > 1) {
                  message.error($t('common.locationInfoAdded'));
                } else {
                  state.areaForm.location = String(e.lnglat.lng);
                  state.areaForm.dimensionality = String(e.lnglat.lat);
                  state.buttonData = 'primary';
                  const innerMarker = new AMap.Marker({
                    position: new AMap.LngLat(e.lnglat.lng, e.lnglat.lat) // 经纬度对象
                  });
                  state.map.add(innerMarker);
                }
              }

              if (state.rangeSetting) {
                state.areaMap.push(e.lnglat);

                console.log(999999999, state.areaMap);
                let polygons = ''; // 定义多边形
                polygons = new AMap.Polygon({
                  path: state.areaMap, // 设置多边形边界路径
                  strokeColor: '#FF33FF', // 线颜色
                  strokeOpacity: 0.2, // 线透明度
                  strokeWeight: 3, // 线宽
                  fillColor: 'pink', // 填充色
                  fillOpacity: 0.35 // 填充透明度
                });

                const icon = new AMap.Icon({
                  imageOffset: new AMap.Pixel(0, -60), // 图像相对展示区域的偏移量，适于雪碧图等
                  imageSize: new AMap.Size(20, 20), // 根据所设置的大小拉伸或压缩图片
                  image: new URL('../../../assets/svg-icon/AdjustRound.svg', import.meta.url).href
                });
                const innerMarker = new AMap.Marker({
                  position: new AMap.LngLat(e.lnglat.lng, e.lnglat.lat), // 经纬度对象
                  icon
                });
                state.map.add(innerMarker);

                state.map.add(polygons); // 生成多边形

                state.map.setFitView(); // 根据地图上添加的覆盖物分布情况，自动缩放地图到合适的视野级别
              }
            }

            state.map.setFitView(); // 根据地图上添加的覆盖物分布情况，自动缩放地图到合适的视野级别

            // eslint-disable-next-line func-names
            AMap.plugin(['AMap.AutoComplete', 'AMap.PlaceSearch'], function () {
              const autoOptions = {
                input: 'tipinputs'
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
      methods.mapInit(state.dimension);
      methods.spacesList();
      methods.edit();
    });
    return { ...methods, ...toRefs(state), formRef, $t };
  }
};
</script>

<template>
  <div class="mapContainer">
    <div class="searchInfo">
      <input
        id="tipinputs"
        v-model="newKeyAddress"
        :placeholder="$t('generate.enter-keyword')"
        class="input-with-select"
      />

      <div class="add-box">
        <NCard>
          <n-scrollbar style="max-height: 520px">
            <div class="form-box">
              <NForm ref="formRef" label-placement="left" :model="areaForm" :rules="areaRules">
                <NGrid :cols="1" :x-gap="24">
                  <NFormItemGridItem :span="1" :label="$t('generate.associated-space')" path="spaces_id">
                    <NSelect
                      v-model:value="selected"
                      class="w-200px"
                      :options="spaces"
                      disabled
                      @update:value="selectUpdate"
                    />
                  </NFormItemGridItem>
                  <NFormItemGridItem :span="1" :label="$t('generate.area-name')" path="name">
                    <NInput v-model:value="areaForm.name" placeholder="" />
                  </NFormItemGridItem>

                  <NFormItemGridItem :span="18" :label="$t('generate.area-location')" class="whitespace-nowrap">
                    <n-button :type="buttonData" disabled @click="locationSetting">
                      {{ $t('generate.set-location') }}
                    </n-button>
                    <span class="required-span">*</span>
                  </NFormItemGridItem>
                  <NFormItemGridItem :label="$t('generate.location-information')" class="whitespace-nowrap" :span="18">
                    <span>{{ $t('generate.longitude') }}</span>
                    :
                    <NInput v-model:value="areaForm.location" disabled />
                    <span>{{ $t('generate.latitude') }}</span>
                    :
                    <NInput v-model:value="areaForm.dimensionality" disabled />
                  </NFormItemGridItem>
                  <NFormItemGridItem :label="$t('generate.map-range')" path="scope">
                    <n-button disabled @click="rangeSettingClick">{{ $t('generate.set-range') }}</n-button>
                  </NFormItemGridItem>
                  <NFormItemGridItem :label="$t('generate.area-image')" path="image_url">
                    <n-upload
                      :action="url + '/file/up'"
                      :default-file-list="fileList"
                      list-type="image-card"
                      @before-upload="beforeUpload"
                      @preview="handlePictureCardPreview"
                    ></n-upload>
                  </NFormItemGridItem>
                  <NFormItemGridItem
                    :label="$t('dashboard_panel.cardName.regionalArea')"
                    path="area"
                    class="text-nowrap"
                  >
                    <NInput v-model:value="areaForm.area" placeholder="" class="mr-2" />
                    <span>{{ $t('dashboard_panel.cardName.hectare') }}</span>
                  </NFormItemGridItem>
                  <NFormItemGridItem
                    label-width="120"
                    :label="$t('generate.required-water-supply-for-crops')"
                    path="water_requirement"
                  >
                    <NInput v-model:value="areaForm.water_requirement" class="mr-2" />
                    <span>{{ $t('generate.rise') }}</span>
                  </NFormItemGridItem>
                  <NFormItemGridItem :label="$t('generate.planting-crops')" path="crop_type">
                    <NInput v-model:value="areaForm.crop_type" />
                  </NFormItemGridItem>
                  <NFormItemGridItem :label="$t('dashboard_panel.cardName.soil')" path="soil_type">
                    <NInput v-model:value="areaForm.soil_type" />
                  </NFormItemGridItem>
                  <NFormItemGridItem :label="$t('generate.irrigation-type')" path="irrigation_type">
                    <NInput v-model:value="areaForm.irrigation_type" />
                  </NFormItemGridItem>
                  <NFormItemGridItem :label="$t('generate.location-details')" path="description">
                    <NInput v-model:value="areaForm.description" type="textarea" :rows="5" />
                  </NFormItemGridItem>
                </NGrid>
                <NSpace class="w-full" :size="24" justify="center">
                  <NButton class="w-72px" @click="closeModal">{{ $t('generate.cancel') }}</NButton>
                  <NButton class="w-72px" type="primary" @click="addAreaClick">{{ $t('common.save') }}</NButton>
                </NSpace>
              </NForm>
            </div>
          </n-scrollbar>
        </NCard>
      </div>
    </div>

    <div id="containersEdit" style="height: 1080px"></div>
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

.form-box {
  padding-right: 15px;
}
</style>
