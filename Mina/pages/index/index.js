const utils = require('../../utils/utils');
const conf = require('../../utils/conf');
var app = getApp();

Page({
  data: {
    outlist: '',
    indicatorDots: false,
    autoplay: false,
    interval: 4000,
    duration: 800,
    current: 0, //初始值banner轮换的index
    bannerimg: '',
    bannerArr: '',
    loading: true
  },
  onShareAppMessage: function () {
    return {
      title: "分享健身运动教学的自制短视频媒体",
      path: "/pages/index/index"
    }
  },
  onLoad: function (options) {
    app.getUserInfo();//触发授权请求

    var that = this;
    wx.request({
      url: conf.apiURL+'/album/get',
      data: {
        t: new Date().getTime()
      },
      method: 'GET',
      success: function (res) {
        var arrBanner = [];
        var arrData = [];
        for(var i = 0;i < res.data.length;i++){
          //推荐到首页的才显示
          if(res.data[i].toindex === 'true'){
            arrData.push(res.data[i]);
            arrBanner.push(res.data[i].banner);
          }
        }

        that.setData({
          outlist: arrData,
          bannerimg: arrData[that.data.current].banner,
          bannerArr: arrBanner,
          loading: false
        });
      },
      fail: function(){
        wx.showToast({
          title: '请求数据错误~'
        });
      }
    })
  },
  reqdetail: function (e) {
    var cid = e.currentTarget.dataset.cid;
    wx.navigateTo({
      url: '../detail/detail?cid=' + cid
    });
  },
  setbanner: function(e){
      //每滚动一次都会触发
      var cur = e.detail.current;
      var that = this;
      //跳动太快延迟500ms
      setTimeout(function(){
        that.setData({
          bannerimg: that.data.bannerArr[cur]
        })
      }, 500);
  }

})