const path = require('path');

module.exports = {
  entry: './node_modules/xlsx/dist/xlsx.full.min.js', // 入口文件
  output: {
    filename: 'xlsx.bundle.js', // 输出文件名
    path: path.resolve(__dirname, 'dist'), // 输出目录
  },
  mode: 'development',
  module: {
    rules: [
      // 例如，处理 JavaScript 文件
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      // 如果需要处理其他文件类型，可以添加更多的规则
    ]
  },
  
  // 开发模式下的源码映射
  devtool: 'source-map',
  
  // 优化选项
  optimization: {
    usedExports: true, // 启用 Tree Shaking
  },
  
  // 解析器选项
  resolve: {
    extensions: ['.js', '.json'] // 自动解析确定的扩展
  },
};