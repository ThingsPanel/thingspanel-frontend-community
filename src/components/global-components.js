/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-31 16:45:45
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-31 10:58:34
 * @FilePath: \ThingsPanel-Backend-Vue\src\components\global-components.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {
  Loading,
  Notification,
  Message,
  Tooltip,
  Select,
  Option,
  Cascader,
  CascaderPanel,
  Link,
  Popover,
  Card,
  Steps,
  Step,
  RadioButton,
  ColorPicker,
  Calendar,
  Empty,
  TimeSelect,
  Progress,
  Autocomplete
} from 'element-ui';

// custom theme
import themeObj from '../themes/xuetangx.project.json';
// registering custom theme

import VueClipboard from 'vue-clipboard2'
import NumberChart from "./e-charts/NumberChart";
import DashboardChart from "./e-charts/DashboardChart";
import CurveChart from "./e-charts/CurveChart";
const GlobalComponents = {};

GlobalComponents.install = (Vue) => {
  Vue.prototype.theme = themeObj.themeName;

  Vue.use(Loading.directive);
  Vue.prototype.$message = Message;
  Vue.prototype.$notify = Notification;

  Vue.use(Tooltip);
  Vue.use(Select);
  Vue.use(Option);
  Vue.use(Cascader);
  Vue.use(CascaderPanel);
  Vue.use(Link);
  Vue.use(Popover);
  Vue.use(Card);
  Vue.use(Steps);
  Vue.use(Step);
  Vue.use(RadioButton);
  Vue.use(ColorPicker);
  Vue.use(Calendar);
  Vue.use(Empty);
  Vue.use(TimeSelect);
  Vue.use(Progress);
  Vue.use(Autocomplete);

  Vue.use(VueClipboard)
  Vue.use(NumberChart);
  Vue.use(DashboardChart);
  Vue.use(CurveChart);
};

export default GlobalComponents;
