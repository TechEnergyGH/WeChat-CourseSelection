// pages/login/login.js
const defaultAvatarUrl = wx.getStorageSync('defaultAvatarUrl')

Page({
  data: {
    userInfo: wx.getStorageSync('userInfo'),
    hasUserInfo: wx.getStorageSync('hasUserInfo'),
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },

  onLoad() {
    console.log('登录刷新')
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },

  onInputChange(e) {
    const nickName = e.detail.value
    let { avatarUrl } = this.data.userInfo
    wx.request({
      url: 'http://127.0.0.1:3000',
      method: 'get',
      data: {
        query: 'SELECT * FROM users WHERE nickName =\'' + nickName + '\''
      },
      success: (res) => {
        if (res.data.length !== 0) {
          avatarUrl = res.data[0].avatarUrl
          console.log('昵称读取成功')
        }
      },
      complete: () => {
        this.setData({
          "userInfo.avatarUrl": avatarUrl,
          "userInfo.nickName": nickName,
          hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
        })
      }
    })
  },

  onButtonLogin() {
    if (this.data.userInfo.avatarUrl == defaultAvatarUrl) {
      wx.showToast({
        title: '未添加头像',
        duration: 1000,
        icon: 'error'
      })
      console.log('未添加头像')
    } else if (this.data.userInfo.nickName == '') {
      wx.showToast({
        title: '未输入昵称',
        duration: 1000,
        icon: 'error'
      })
      console.log('未输入昵称')
    } else {
      if (this.data.userInfo.nickName !== wx.getStorageSync('userInfo').nickName) {
        wx.setStorageSync('userInfo', this.data.userInfo)
        wx.setStorageSync('hasUserInfo', this.data.hasUserInfo)
      }
      const userInfo = this.data.userInfo;
      (async function (){
        try {
          await new Promise((resolve, reject)=>{
            wx.request({
              url: 'http://127.0.0.1:3000',
              method: 'get',
              data: {
                query: 'SELECT * FROM users WHERE nickName =\'' + userInfo.nickName + '\''
              },
              success: (res) => {
                if (res.data.length == 0) {
                  console.log('昵称不存在')
                  wx.request({
                    url: 'http://127.0.0.1:3000',
                    method: 'post',
                    data: {
                      table: 'users',
                      columns: ['nickName', 'avatarUrl'],
                      values: [[userInfo.nickName, userInfo.avatarUrl]]
                    },
                    success: (res) => {
                      console.log('昵称写入成功');
                      resolve(res);
                    },
                    fail:(err)=>{
                      reject(err);
                    }
                  })
                } else if (res.data[0].avatarUrl !== userInfo.avatarUrl) {
                  console.log('头像修改请求')
                  wx.request({
                    url: 'http://127.0.0.1:3000',
                    method: 'put',
                    data: {
                      table: 'users',
                      set: { avatarUrl: userInfo.avatarUrl },
                      where: { id: res.data[0].id }
                    },
                    success: () => {
                      console.log('头像修改成功');
                      resolve();
                    },
                    fail: () => {
                      console.log('头像修改失败');
                      reject();
                    }
                  })
                } else {
                  resolve(res);
                }
              },
              fail:(err)=>{
                reject(err);
              }
            })
          });
      
         await new Promise((resolve,reject)=>{
          wx.request({
            url: 'http://127.0.0.1:3000',
            method: 'get',
            data: {
              query: 'SELECT * FROM users WHERE nickName =\'' + userInfo.nickName + '\''
            },
            success: (res) => {
              userInfo.id = res.data[0].id;
              wx.setStorageSync('userInfo', userInfo);
              resolve(res);
            },
            fail:(err)=>{
              reject(err);
            }
          })
         });

         await new Promise((reslove,reject)=>{
            wx.request({
              url: 'http://127.0.0.1:3000',
              method: "get",
              data: {
                query: 'SELECT * FROM class;'
            },
            success: (res)=>{
              wx.setStorageSync('classList', res.data)
              reslove(res)
            },
            fail: (err)=>{
              reject(err)
            }
            })
         })
        } catch (err) {
          console.error(err);
        }
      })();
      wx.switchTab({
        url: '../index/index',
      })
      console.log('登录成功');
    }
  },

  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
})