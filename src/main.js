import 'normalize.css';
import '@/styles/app.scss';
import 'echarts/lib/chart/bar';
import 'echarts/lib/chart/line';
import 'echarts/lib/chart/pie';
// echarts component
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/legend';

import Vue from "vue";
import stringify from 'qs/lib/stringify';
import VueAxiosPlugin from 'vue-axios-plugin';
import App from "./App.vue";
import router from "./router";
import store from "./core/services/store";
import GlobalComponents from './components/global-components';
import { jsonProp } from './utils/tool';
import ApiService from "./core/services/api.service";
// import MockService from "./core/mock/mock.service";
import { VERIFY_AUTH } from "./core/services/store/auth.module";
import { RESET_LAYOUT_CONFIG } from "@/core/services/store/config.module";
// import VueImageMarker from './components/common/vue-image-marker.vue'

import "@/assets/sass/common.scss";
import "echarts/theme/macarons.js";


import ElementUI from "element-ui";

// mock data
import '@/mock';

import VuePersianDatetimePicker from 'vue-persian-datetime-picker';
Vue.component('date-picker', VuePersianDatetimePicker);
// Vue.component('VImageMarker', VueImageMarker)

Vue.config.productionTip = false;

Vue.use(ElementUI);


// import $ from 'jquery';
// Vue.use($);

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
import "./core/plugins/apexcharts";
import "./core/plugins/metronic";
import "@mdi/font/css/materialdesignicons.css";

// map
import AMap from 'vue-amap';
Vue.use(AMap);

AMap.initAMapApiLoader({
    key: 'bfc1a098e3ea0bd05273840cff285dfc',
    plugin: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geolocation', 'AMap.OverView', 'AMap.MapType'],
    v: '1.4.4'
});

// API service init
ApiService.init();

import DevicePixelRatio from './assets/js/layout/base/devicePixelRatio.js';
//其它使用
//全局引入devicePixelRatio.js
//在页面加载之时，调用此方法初始化页面比例
new DevicePixelRatio().init();

// Remove this to disable mock API
// MockService.init();

router.beforeEach((to, from, next) => {
    // reset config to initial state
    store.dispatch(RESET_LAYOUT_CONFIG);

    // Ensure we checked auth before each page load.
    Promise.all([store.dispatch(VERIFY_AUTH)]).then(next);

    // Scroll page to top on every route change
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);

    setTimeout(() => {
        var _hmt = _hmt || [];
        (function() {
            document.getElementById('baidu_tj') && document.getElementById('baidu_tj').remove();
            var hm = document.createElement("script");
            hm.src = "https://hm.baidu.com/hm.js?e4910b169e66c3c3d29050a965c59f1c";
            hm.id = "baidu_tj"

            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(hm, s);
        })();
    }, 0);
});


new Vue({
    router,
    store,
    i18n,
    vuetify,
    template: '<App/>',
    components: { App },
    render: h => h(App)
}).$mount("#app");