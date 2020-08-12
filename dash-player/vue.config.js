module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/fungate/'
    : '/',

  productionSourceMap: false,

  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        args[0].title = 'Fungate Server'
        return args
      })
  }
}
