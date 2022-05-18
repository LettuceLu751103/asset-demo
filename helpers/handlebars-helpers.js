module.exports = {
    ifCond: function (a, b, options) {
        return a === b ? options.fn(this) : options.inverse(this)
    },
    statusIdentify: function (statusCode) {
        if (statusCode === 0) {
            return '移轉中'
        } else if (statusCode === 1) {
            return '移轉完成'
        } else if (statusCode === 2) {
            return '資產缺少中'
        } else {
            return '未知'
        }
    }
}