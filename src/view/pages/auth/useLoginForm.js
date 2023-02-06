import { useStore } from "@/core/services/store";
import { reactive, ref, getCurrentInstance } from "@vue/composition-api";
import { clearErrorsMsg, is_email } from "@/utils/helpers";
import { LOGIN } from "@/core/services/store/auth.module";



export default function useLoginForm() {
    // 等同于 this
    const self = getCurrentInstance().proxy

    // vuex
    const store = useStore();

    // el-form 元素
    let loginFormRef = ref();

    // 请求状态
    let loading = ref(false);

    // 表单数据
    let formData = reactive({
        email: "",
        password: "",
    })

    // 表单验证规则
    const rules = reactive({
        email: [
            {required: true, message: self.$t("LOGIN.TITLE2"), validator: check_email}
        ],
        password: [
            {required: true, message: self.$t("LOGIN.TITLE3"), min: 6},
        ]
    })
    // el-form 表单自定义验证方法
    const check_email = (rule, value, callback) => {
        if (is_email(value)) {
            callback()
        }
        callback(new Error(self.$t("LOGIN.TITLE4")))
    }
    // 服务器返回错误
    let errors = reactive({
        email: "",
        password: "",
    })

    // 提交登录请求
    function handleSubmit() {
        loginFormRef.value.validate((valid) => {
            // 验证不通过则不往下执行
            if (!valid) return;

            // 按钮 loading
            if (loading.value) return;
            loading.value = true;

            // 清除自定义错误
            clearErrorsMsg(errors)

            // vuex actions 提交登录请求
            store.dispatch(LOGIN, formData)
                .then((response) => {
                    if (response.code !== 200) {
                        errors.email = self.$t("LOGIN.WrongPassword")
                    }
                }).finally(() => {
                    // 速度太快，延迟 500 ms
                    setTimeout(()=>{
                        loading.value = false
                    }, 1000)
                })

        })
    }

    return {
        loginFormRef,
        formData,
        loading,
        rules,
        errors,
        handleSubmit,
    }
}