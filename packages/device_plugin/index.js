import DevicePluginEditor from "./editor";
import TslEditor from "./tsl/editor"
import CommonControl from "./charts/components/control"
import CommonStatus from "./charts/components/dashboard/Status"
import CommonDeviceStatus from "./charts/components/dashboard/DeviceStatus"

import './style/dark-theme.scss'

import {
    Card,
    Steps,
    Step,
    RadioButton,
    RadioGroup,
    Slider
} from 'element-ui';

const install = Vue => {
    Vue.use(Card);
    Vue.use(Steps);
    Vue.use(Step);
    Vue.use(RadioButton);
    Vue.use(RadioGroup);
    Vue.use(Slider);
    Vue.component(DevicePluginEditor.name, DevicePluginEditor);
    Vue.component(TslEditor.name, TslEditor);
    Vue.component(CommonControl.name, CommonControl);
    Vue.component(CommonStatus.name, CommonStatus);
    Vue.component(CommonDeviceStatus.name, CommonDeviceStatus);

}

if (typeof window.Vue !== 'undefined') {
    install(Vue) //
}
export default {
    install
}