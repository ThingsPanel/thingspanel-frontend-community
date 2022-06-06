const local_url =
    (process.env.VUE_APP_BASE_URL ||
        document.location.protocol + "//" + document.domain + ":9999/");

export default local_url
