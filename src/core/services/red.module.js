const RED_TOKEN_KEY = "red_token";
const RED_TOKEN_EXPIRED_KEY = "expires_in";
const RED_TOKEN_TYPE_KEY = "token_type";

const setRedToken = (res) => {
    console.log(res)
    window.localStorage.setItem(RED_TOKEN_KEY, res.access_token);
    window.localStorage.setItem(RED_TOKEN_EXPIRED_KEY, res.expires_in);
    window.localStorage.setItem(RED_TOKEN_TYPE_KEY, res.token_type);
}

const getRedToken = () => {
    let red_token = window.localStorage.getItem(RED_TOKEN_KEY);
    if (!red_token) {
        return false;
    }
    return red_token;
}

const getRedTokenExpired = () => {
    let expired = window.localStorage.getItem(RED_TOKEN_EXPIRED_KEY);
    return expired;
}

const clearToken = () => {
    window.localStorage.removeItem(RED_TOKEN_KEY);
    window.localStorage.removeItem(RED_TOKEN_EXPIRED_KEY);
    window.localStorage.removeItem(RED_TOKEN_TYPE_KEY);
}

export default { setRedToken, getRedToken, getRedTokenExpired, clearToken }