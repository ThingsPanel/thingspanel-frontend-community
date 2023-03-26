// 状态 0-待推送 1-已推送 2-升级中 3-升级成功 4-升级失败 5-已取消

const UpgradeState = {
    // 所有状态
    all: ["-1", "所有状态"],
    // 待推送
    unpushed: ["0", "待推送"],
    // 已推送
    pushed: ["1", "已推送"],
    // 升级中
    upgrading: ["2", "升级中"],
    // 升级成功
    upgraded: ["3", "升级成功"],
    // 升级失败
    failed: ["4", "升级失败"],
    // 已取消
    cancelled: ["5", "已取消"],
    // 通过value获取text
    getText: value => {
        const arr = Object.values(UpgradeState).find(v => typeof v != "function" && String(v[0]) === String(value));
        return arr ? arr[1] : "";
    },
    // 通过value获取key
    getKey: value => Object.keys(UpgradeState).find(key => UpgradeState[key] === value),
}

export { UpgradeState }