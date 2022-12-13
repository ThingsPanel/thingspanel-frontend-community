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
  ColorPicker
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

  Vue.use(VueClipboard)
  Vue.use(NumberChart);
  Vue.use(DashboardChart);
  Vue.use(CurveChart);
};

export default GlobalComponents;
