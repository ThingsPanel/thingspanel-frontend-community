import 'normalize.css';
import '@/styles/app.scss';

import AMap from 'vue-amap';
Vue.use(AMap);

  // 初始化vue-amap
AMap.initAMapApiLoader({
  // 高德key
  key: '890a2c1acff8c505c7d88acaa21f8804',
  plugin: [
    'AMap.Geolocation',  //定位空间，用来获取和展示用户主机所在的经纬度位置
    'AMap.Autocomplete',  //输入提示插件
    'MarkerClusterer',
    'AMap.PlaceSearch', //POI搜索插件
    'AMap.Scale',   //右下角缩略图插件，比例尺
    'AMap.OverView', //地图鹰眼插件
    'AMap.ToolBar',  //地图工具条
    'AMap.MapType',  //类别切换空间，实现默认图层与卫星图，实施交通层之间切换的控制
    'AMap.PolyEditor', //编辑 折线多边形
    'AMap.CircleEditor',
    "AMap.Geocoder"     //地图编码
  ]
});
window._AMapSecurityConfig = {
    securityJsCode: '0e3695afbd6670b268044894df285dde',
}

import Vue from "vue";
import stringify from 'qs/lib/stringify';
import VueAxiosPlugin from 'vue-axios-plugin';
import App from "./App.vue";
import Share from "./Share.vue"
import router from "./router";
import store from "./core/services/store";
import GlobalComponents from './components/global-components';
import { jsonProp } from './utils/tool';
import ApiService from "./core/services/api.service";

/**
 * video.js
 */
import Video from 'video.js'
import 'video.js/dist/video-js.css'
Vue.prototype.$video = Video

import "@/styles/common.scss";
import * as echarts from 'echarts';
Vue.prototype.$echarts = echarts

import ElementUI from "./core/plugins/element-ui";

// mock data
import '@/mock';

import VuePersianDatetimePicker from 'vue-persian-datetime-picker';
Vue.component('date-picker', VuePersianDatetimePicker);

Vue.config.productionTip = false;

Vue.use(ElementUI);

// import tpIot from "tp-iot"
import tpIot from "/packages/device_plugin"
Vue.use(tpIot)


// 组合式api
import VueCompositionApi from "@vue/composition-api"
Vue.use(VueCompositionApi)

import "@/core/mixins/checkAuth"
import "@/utils/tool.js"

Vue.use(VueAxiosPlugin, {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    transformRequest: [
        function a(data) {
            return stringify(jsonProp(data));
        },
    ],
    resHandleFunc: (response) => {
        const data = response.data;
        return {
            status: response.status || 500,
            ...data,
        };
    },
});

Vue.use(GlobalComponents);

// Global 3rd party plugins
import "popper.js";
import "tooltip.js";
import PerfectScrollbar from "perfect-scrollbar";
window.PerfectScrollbar = PerfectScrollbar;
import ClipboardJS from "clipboard";
window.ClipboardJS = ClipboardJS;

// Vue 3rd party plugins
import i18n from "./core/plugins/vue-i18n";
import vuetify from "./core/plugins/vuetify";
import "./core/plugins/portal-vue";
import "./core/plugins/bootstrap-vue";
import "./core/plugins/perfect-scrollbar";
import "./core/plugins/highlight-js";
import "./core/plugins/inline-svg";
import "./core/plugins/metronic";
import "@mdi/font/css/materialdesignicons.css";

// API service init
ApiService.init();

import DevicePixelRatio from './assets/js/layout/base/devicePixelRatio.js';
//其它使用
//全局引入devicePixelRatio.js
//在页面加载之时，调用此方法初始化页面比例
new DevicePixelRatio().init();


// 注册一个全局自定义指令 `v-focus`
Vue.directive('focus', {
    // 当被绑定的元素插入到 DOM 中时……
    inserted: function(el) {
        // 获取input元素
        let input = el.querySelector('input')
            // 聚焦元素
        input ? input.focus() : el.focus()
    }
})

new Vue({
    router,
    store,
    i18n,
    vuetify,
    template: "<App/>",
    components: { App },
    render: h => h(App)
}).$mount("#app");