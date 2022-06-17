import {ref} from "@vue/composition-api/dist/vue-composition-api";
import {kv_export} from "@/api/kv";

export default function useDataExport(params) {
    let exportVisible = ref(false)
    let downloadUrl = ref("")
    let exporting = ref(false)

    function handleExport() {
        if (exporting.value) return
        exporting.value = true

        // 拷贝 params
        let p = JSON.parse(JSON.stringify(params))
        // 删除页码，要导出所有
        if ('page' in p) delete p.page
        if ('limit' in p) delete p.limit
        // 代开弹窗
        exportVisible.value = true
        kv_export(p).then(({data}) => {
            if (data.code === 200) {
                downloadUrl.value = location.protocol + "//" + location.host + '/' + data.data
            }
        }).finally(() => {
            exporting.value = false
        })
    }

    return {
        exportVisible,
        downloadUrl,
        exporting,
        handleExport,
    }
}