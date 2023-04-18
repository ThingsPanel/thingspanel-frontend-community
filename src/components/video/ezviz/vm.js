const ACCESS_TOKEN = "ezviz_access_token";
const EXPIRE_TIME = "ezviz_expire_time";

export default {

    

    setToken: obj => {
        window.localStorage.setItem(ACCESS_TOKEN, obj.accessToken);
        window.localStorage.setItem(EXPIRE_TIME, obj.expireTime);
    },

    getToken: () => {
        const accessToken = window.localStorage.getItem(ACCESS_TOKEN) || "";
        const expireTime = window.localStorage.getItem(EXPIRE_TIME) || "";
        return { accessToken, expireTime};
    },
}
