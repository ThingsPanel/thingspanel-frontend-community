import { useStore } from "@/core/services/store";
import { reactive, ref, getCurrentInstance } from "@vue/composition-api";
import { clearErrorsMsg, is_email } from "@/utils/helpers";
import { REGIST_TENANT, SEND_CAPTCHA } from "@/core/services/store/auth.module";



export default function useRegisterForm() {
    // 等同于 this
    const self = getCurrentInstance().proxy

    // vuex
    const store = useStore();

    // el-form 元素
    let registerFormRef = ref();

    // 请求状态
    let loading = ref(false);

    // 请求验证码状态
    let smsCodeLoading = ref(false);

    // 表单数据
    let formData = reactive({
        email: "",
        password: "",
        phone: "",
        captcha: "",
    })

    // 表单验证规则
    const rules = reactive({
        email: [
            { required: true, message: self.$t("LOGIN.TITLE2"), validator: check_email }
        ],
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
        phone: "",
        captcha: "",
    })

    // 提交登录请求
    function handleSubmit() {
        registerFormRef.value.validate((valid) => {
            // 验证不通过则不往下执行
            if (!valid) return;

            // 按钮 loading
            if (loading.value) return;
            loading.value = true;

            // 清除自定义错误
            clearErrorsMsg(errors)

            // vuex actions 提交登录请求
            store.dispatch(REGIST_TENANT, {
                email: formData.email,
                password: formData.password,
                phone_number: formData.phone,
                verification_code: formData.captcha,
            }).then((response) => {
                if (response.code === 200 || response.message === "注册成功") {
                    this.$router.push("/login")
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

        registerFormRef.value.validateField("phone", (valid) => {
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
        registerFormRef,
        formData,
        loading,
        smsCodeLoading,
        rules,
        errors,
        handleSubmit,
        sendCaptchaCode,
    }
}