module.exports = {
    ifCond: function (a, b, options) {
        console.log('傳入的a: ' + a)
        console.log('傳入的a: ' + b)
        return a === b ? options.fn(this) : options.inverse(this)
    }
}