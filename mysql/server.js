const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

const app = express();

// 解析JSON请求体
app.use(bodyParser.json({ limit: '50mb' })); // 设置body-parser大小限制
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })); // 支持urlencoded格式

// 创建数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'school'
});

// 处理GET请求的根路径，查询数据库并返回结果，显然为了请求的通用性，则我的查询语句由小程序端完整生成，服务端只负责查询语句的中转
app.get('/', (req, res) => {

  pool.query(req.query.query, (error, results, fields) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results); // 返回查询结果
  });
});

// 处理POST请求，用于数据写入
app.post('/', (req, res) => {
  const { table, columns, values } = req.body; // 从请求体获取数据

  // 检查values是否为二维数组
  if (!Array.isArray(values) || !values.every(Array.isArray)) {
    return res.status(400).send('Invalid values format. Expected a 2D array.');
  }

  // 构建每行的占位符
  const placeholders = columns.map(() => '?').join(', '); // 列数个问号，用逗号连接
  const rows = values.map(row => `(${row.map(() => '?').join(', ')})`).join(', ');

  // 构建SQL插入语句
  const sql = `INSERT INTO \`${table}\` (${columns.join(', ')}) VALUES ${rows}`;

  // 执行SQL插入语句
  pool.query(sql, values.flat(), (error, results, fields) => {
    // 返回插入错误的信息
    if (error) {
      console.error(error);
      return res.status(500).send('Database error');
    }
    // 返回提示信息
    res.status(201).json({ message: 'Data inserted successfully', insertIds: results.insertId });
  });
});

app.put('/', (req, res) => {
  const { table, set, where } = req.body; // 从请求体获取数据
  const setValues = Object.values(set);
  const whereValues = Object.values(where);

  // 构建SET部分
  const setClause = Object.keys(set).map((key, index) => `${key} = ?`).join(', ');

  // 构建WHERE部分
  const whereClause = Object.keys(where).map((key, index) => `${key} = ?`).join(' AND ');

  const sql = `UPDATE \`${table}\` SET ${setClause} WHERE ${whereClause}`;

  pool.query(sql, [...setValues, ...whereValues], (error, results, fields) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Database error');
    }
    if (results.affectedRows > 0) {
      res.status(200).json({ message: 'Data updated successfully', affectedRows: results.affectedRows });
    } else {
      res.status(404).json({ message: 'No data was updated' });
    }
  });
});

// 处理DELETE请求，用于数据删除
app.delete('/', (req, res) => {
  const { table, where } = req.body; // 假设where就是delClassList
  const whereValues = [];
  let whereClause = '';

  if (Array.isArray(where)) {
    // 构建OR连接的WHERE子句，每个子句内是AND连接
    where.forEach((condition, index) => {
      const conditionKeys = Object.keys(condition);
      const andConditions = conditionKeys.map(key => `${key} = ?`).join(' AND ');
      whereClause += `${index > 0 ? ' OR ' : ''}(${andConditions})`;
      whereValues.push(...conditionKeys.map(key => condition[key]));
    });
  }

  const sql = `DELETE FROM \`${table}\` WHERE ${whereClause}`;

  pool.query(sql, whereValues, (error, results, fields) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Database error');
    }
    if (results.affectedRows > 0) {
      res.status(200).json({ message: 'Data deleted successfully', affectedRows: results.affectedRows });
    } else {
      res.status(404).json({ message: 'No data was deleted' });
    }
  });
});

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

// 启动服务器监听3000端口，并打印启动信息
app.listen(3000, () => {
  console.log('Server running at http://127.0.0.1:3000');
});
