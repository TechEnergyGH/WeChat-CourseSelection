// index.js

Page({
  data: {
    days: ['一', '二', '三', '四', '五'], // 星期几
    times: [0, 1, 2, 3, 4, 5],
    classList: [{ id: 1, name: "离散数学", days: "一", time: 1 ,credits: 3}],
    timetable: []
  },

  onLoad: function () {
  },

  onShow() {
    console.log('课表刷新');
    const that = this;
    wx.request({
      url: 'http://127.0.0.1:3000',
      method: 'GET',
      header: {
        'content-type': 'application/json', // 默认值
        'Cache-Control': 'no-cache' // 禁用缓存
      },
      data: {
        query: 'SELECT * FROM select_class WHERE users_id =\'' + wx.getStorageSync('userInfo').id + '\''
      },
      success: (res) => {
        res.data.sort((a, b) => a.class_id - b.class_id);
        that.data.classList = [];
        const list = wx.getStorageSync('classList');
        for (let i = 0; i < res.data.length; i++) {
          for (let j = 0; j < list.length; j++) {
            if (res.data[i].class_id === list[j].id) {
              // 计算 days 和 time
              const dayIndex = list[j].time / 6 | 0; // 使用整除来获取天数
              const time = list[j].time % 6; // 获取节次

              // 确保 dayIndex 在 that.data.days 的范围内
              if (dayIndex >= 0 && dayIndex < that.data.days.length) {
                that.data.classList.push({
                  id: list[j].id,
                  name: list[j].name,
                  days: that.data.days[dayIndex],
                  time: time
                });
              } else {
                console.warn(`Invalid dayIndex: ${dayIndex}`);
              }
            }
          }
        }

        const { days, times, classList } = that.data;
        // 初始化一个空的 timetable
        const timetable = times.map(() => {
          return days.map(() => ({ hasCourse: false, courseName: '' }));
        });
        // 遍历所有课程，填充 timetable
        classList.forEach(course => {
          const dayIndex = days.indexOf(course.days); // 找到对应的星期几
          const timeIndex = course.time; // 将基于1的时间转换为基于0的索引
          if (dayIndex !== -1 && timeIndex >= 0 && timeIndex < times.length) {
            timetable[timeIndex][dayIndex] = { hasCourse: true, courseName: course.name };
          }
        });
        that.setData({ timetable });
      },
      fail: (err) => {
        console.log('请求失败')
      }
    });

    this.setData({
      days: this.data.days,
      times: this.data.times,
    })
  },

  onOutClass: function () {
    const XLSX = require('xlsx')
    console.log('导出');
    var data = [['', ...this.data.days]];
    this.data.timetable.forEach((item, index) => {
      var t = ['第' + (index + 1) + '节'];
      item.forEach((j) => {
        if (j.hasCourse) {
          t.push(j.courseName);
        } else {
          t.push('');
        }
      })
      data.push(t);
    });
    console.log(data);

    var workbook = XLSX.utils.book_new();
    var worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Class");

    // 将工作簿转换为二进制数据
    var wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // 将二进制数据转换为ArrayBuffer
    var arrayBuffer = new Uint8Array(wbout).buffer;

    // 发送请求
    wx.request({
      url: 'http://127.0.0.1:3000/api/upload', // 替换为你的实际API地址
      method: 'post',
      header: {
        'content-type': 'application/octet-stream' // 设置Content-Type为二进制流
      },
      data: arrayBuffer,
      responseType: 'arraybuffer', // 设置响应类型为ArrayBuffer
      success: function (res) {
        if (res.statusCode === 200) {
          console.log('文件已成功上传');
          // 处理响应，比如更新UI
        } else {
          console.error('文件上传失败，状态码：', res.statusCode);
        }
      },
      fail: function (err) {
        console.error('网络请求失败：', err);
      }
    });
  }
})
