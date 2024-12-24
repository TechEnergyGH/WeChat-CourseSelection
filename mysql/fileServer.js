const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' })); // 设置body-parser大小限制

app.post('/api/upload', (req, res) => {
  const fileData = req.body; // 获取二进制数据
  const filename = 'class.xlsx'; // 文件名

  // 定义文件存储路径
  const uploadPath = path.join(__dirname, 'uploads', filename);

  // 确保上传目录存在
  const uploadsDir = path.dirname(uploadPath);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 保存文件
  fs.writeFile(uploadPath, fileData, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('保存文件时发生错误');
    }
    res.send('文件已成功保存');
  });
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});