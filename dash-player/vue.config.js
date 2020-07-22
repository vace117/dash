module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/dash/'
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
