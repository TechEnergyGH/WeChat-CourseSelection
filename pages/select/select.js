// pages/select/select.js
Page({
  data: {
    classList: [],
    classTime: ['8:00', '10:00', '14:00', '16:00', '19:00', '20:50'],
    week: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    selectClass: []
  },

  onLoad(options) {
    console.log('选课刷新');
    const that = this
    let classList = this.data.classList;
    const week = this.data.week;
    const classTime = this.data.classTime;
    let selectClass = this.data.selectClass;
    (async function () {
      try {
        await new Promise((resolve, reject) => {
          wx.request({
            url: 'http://127.0.0.1:3000',
            method: "get",
            data: {
              query: 'SELECT * FROM class;'
            },
            success: (res) => {
              console.log('课程读取成功');
              classList = res.data;
              wx.setStorageSync('classList', res.data)
              classList = classList.map(item => ({ ...item, selected: false })
              );
              classList.forEach((item, index) => {
                item.time = week[item.time / 6 | 0] + classTime[item.time % 6]
              });

              that.setData({
                classList: classList
              });
              resolve(res);
            },
            fail: (err) => {
              console.error('请求失败', err);
              reject(err);
            }
          });
        });

        await new Promise((resolve, reject) => {
          wx.request({
            url: 'http://127.0.0.1:3000',
            method: 'get',
            data: {
              query: 'SELECT * FROM select_class WHERE users_id =\'' + wx.getStorageSync('userInfo').id + '\''
            },
            success: (res) => {
              selectClass = res.data;
              that.data.selectClass = selectClass;
              selectClass.sort((a, b) => a.class_id - b.class_id);
              for (let i = 0, j = 0; i < selectClass.length && j < classList.length;) {
                if (selectClass[i].class_id == classList[j].id) {
                  classList[j].selected = true
                  i++, j++;
                } else {
                  j++;
                }
              }
              that.setData({
                classList: classList
              })
              resolve(res);
            },
            fail: (err) => {
              reject(err);
            }
          });
        });
      } catch (err) {
        console.log(err);
      }
    })();
  },

  onClassSelect(e) {
    console.log('选择')
    const index = e.currentTarget.dataset.index;
    const updatedList = this.data.classList.map((item, idx) => {
      if (idx === index) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });
    this.setData({
      classList: updatedList
    });
  },

  onConfirmClass() {
    console.log('课程选择确认');
    var classList = this.data.classList.filter(item => item.selected);
    const repeat = function () {
      var setList = new Set()
      for (let item of classList) {
        if (setList.has(item.time)) {
          return true;
        }
        setList.add(item.time)
      }
      return false;
    }();
    if (repeat) {
      wx.showToast({
        title: '课程时间重复',
        duration: 1000,
        icon: 'error'
      });
    } else {
      var newClassList = []
      var delClassList = []
      const that = this;
      const selectClass = this.data.selectClass;
      const id = wx.getStorageSync('userInfo').id;
      for (let item of classList) {
        let t = true
        for (let j of selectClass) {
          if (item.id == j.class_id) {
            t = false
            break;
          }
        }
        if (t) {
          newClassList.push([id, item.id])
        }
      }
      for (let i of selectClass) {
        let t = true
        for (let j of classList) {
          if (i.class_id == j.id) {
            t = false
            break;
          }
        }
        if (t) {
          delClassList.push({users_id:id,class_id:i.class_id})
        }
      };
      (async function () {
        try {
          if(newClassList.length !== 0)
          {
            await new Promise((resolve, reject) => {
              wx.request({
                url: 'http://127.0.0.1:3000',
                method: 'post',
                data: {
                  table: 'select_class',
                  columns: ['users_id', 'class_id'],
                  values: newClassList
                },
                success: () => {
                  resolve();
                  console.log('课表添加');
                },
                fail: (err) => {
                  reject(err);
                }
              })
            });
          }

          if(delClassList.length !== 0)
          {
            await new Promise((resolve, reject) => {
              wx.request({
                url: 'http://127.0.0.1:3000',
                method: 'delete',
                data: {
                  table: 'select_class',
                  where: delClassList
                },
                success: () => {
                  resolve();
                  console.log('课表删除')
                },
                fail: (err) => {
                  reject();
                }
              });
            });
          }

          await new Promise((resolve,reject)=>{
            wx.request({
              url: 'http://127.0.0.1:3000',
              method: 'get',
              data: {
                query: 'SELECT * FROM select_class WHERE users_id =\'' + wx.getStorageSync('userInfo').id + '\''
              },
              success: (res) => {
                that.data.selectClass = res.data;
                that.data.selectClass.sort((a, b) => a.class_id - b.class_id);
                resolve(res);
              },
              fail: (err) => {
                reject(err);
              }
            });
          });
        } catch (err) {
          console.log(err);
        }
      })();
      wx.showToast({
        title: '保存成功',
        duration: 1000,
        icon: 'success'
      });
    }
  }
})