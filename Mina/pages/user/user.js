var app = getApp();
Page({
  data: {
    userInfo: {},
    storage: 0
  },
  onLoad: function () {
    var that = this;
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      //更新数据
      that.setData({
        userInfo:userInfo
      })
    });
  },
  onReady: function () {
    var that = this;
    wx.getStorageInfo({
      success: function(res) {
        that.setData({
          storage: res.currentSize
        })
      }
    });
  },
  clearStor: function(){
    var that = this;
    wx.showModal({
      title: '提示',
      content: '这将会清除观看历史和收藏列表，确定要删除本地缓存吗？',
      success: function(res) {
        if (res.confirm) {
          wx.clearStorage();
          that.setData({
            storage: 0
          })
        }
      }
    })
  }
})