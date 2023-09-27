import { useStore } from "@/core/services/store";
import { reactive, ref, getCurrentInstance } from "@vue/composition-api";
import { clearErrorsMsg } from "@/utils/helpers";
import { PASSWORD_RESET, SEND_CAPTCHA } from "@/core/services/store/auth.module";



export default function useResetForm() {
    // 等同于 this
    const self = getCurrentInstance().proxy

    // vuex
    const store = useStore();

    // el-form 元素
    let resetFormRef = ref();

    // 请求状态
    let loading = ref(false);

    // 请求验证码状态
    let smsCodeLoading = ref(false);

    // 表单数据
    let formData = reactive({
        phone: "",
        captcha: "",
        password: "",
    })

    // 表单验证规则
    const rules = reactive({
        password: [
            { required: true, message: self.$t("LOGIN.TITLE3"), min: 6 },
        ],
        phone: [
            { required: true, message: self.$t("LOGIN.TITLE5"), min: 11 },
        ],
        captcha: [
            { required: true, message: self.$t("LOGIN.TITLE6"), max: 16 },
        ]
    })
    // 服务器返回错误
    let errors = reactive({
        phone: "",
        captcha: "",
        password: "",
    })

    // 提交重置密码请求
    function handleSubmit() {
        resetFormRef.value.validate((valid) => {
            // 验证不通过则不往下执行
            if (!valid) return;

            // 按钮 loading
            if (loading.value) return;
            loading.value = true;

            // 清除自定义错误
            clearErrorsMsg(errors)

            // vuex actions 提交登录请求
            store.dispatch(PASSWORD_RESET, {
                password: formData.password,
                phone_number: formData.phone,
                verification_code: formData.captcha,
            }).then((response) => {
                console.error(response)
                if (response.code === 200) {
                    this.$router.push("/login")
                    // errors.email = self.$t("LOGIN.WRONG_PASSWORD")
                } 
            }).finally(() => {
                // 速度太快，延迟 500 ms
                setTimeout(() => {
                    loading.value = false
                }, 1000)
            })

        })
    }

    // 发送验证码
    function sendCaptchaCode(callback) {

        resetFormRef.value.validateField("phone", (valid) => {
            // 验证不通过则不往下执行
            if (valid) return;

            // 按钮 loading
            if (loading.value) return;
            loading.value = true;

            // 清除自定义错误
            clearErrorsMsg(errors)

            // vuex actions 提交登录请求
            store.dispatch(SEND_CAPTCHA, { phone_number: formData.phone })
                .then((response) => {
                    if (response.code !== 200) {
                        errors.captcha = self.$t("LOGIN.WRONG_PHONE")
                    } else {
                        loading.value = false
                        callback();
                    }
                })
        })
    }
    return {
        resetFormRef,
        formData,
        loading,
        smsCodeLoading,
        rules,
        errors,
        handleSubmit,
        sendCaptchaCode,
    }
}