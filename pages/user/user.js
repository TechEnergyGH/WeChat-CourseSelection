// pages/user/user.js

Page({
  data: {},
  onLoad(options) {
    this.setData({
      "userInfo.avatarUrl": wx.getStorageSync('userInfo').avatarUrl,
      "userInfo.nickName": wx.getStorageSync('userInfo').nickName
    })
  },

  onButtonSignout(){
    wx.setStorageSync('userInfo', {id:0,avatarUrl:wx.getStorageSync('defaultAvatarUrl'),nickName:''})
    wx.setStorageSync('hasUserInfo', false)
    wx.reLaunch({
      url: '../login/login',
    })
  }
})