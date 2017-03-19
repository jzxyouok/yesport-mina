var app = getApp();

Page({
  data:{
    userInfo: {},
    nid: '1',
  },
  onLoad:function(options){
    var that = this;
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      //更新数据
      that.setData({
        userInfo:userInfo
      });
    });
  },
  onShareAppMessage: function () {
    return {
      title: "我是"+this.data.userInfo.nickName+"，这是我的名片~",
      path: "/pages/about/about"+this.data.nid
    }
  }
})