import {ref} from "@vue/composition-api";

export default function usePluginCUD(v1) {
    let data = ref({});
    washData();

    function getPlugin() {

    }


    function washData() {
        data.value.pluginId = v1.type;
    }

    return {
        getPlugin
    }
}