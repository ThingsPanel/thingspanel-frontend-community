const local_url = IPConfig.BASE_URL  ||
    (document.location.protocol + "//" + document.domain + ":9999/");

const ws_url = IPConfig.WS_URL || ('ws://' + document.domain + ':9999/ws')

const red_url = IPConfig.RED_URL ||
    (document.location.protocol + "//" + document.domain + ":1880/");

export {local_url, red_url, ws_url}
