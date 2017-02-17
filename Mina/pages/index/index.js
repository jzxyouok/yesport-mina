const utils = require('../../utils/utils');

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
    var that = this;
    wx.request({
      url: 'https://dev.yechtv.com/api/',
      data: {
        type: 'index',
        time: new Date().getTime()
      },
      method: 'GET',
      success: function (res) {
        var bnNewArry = [];
        for(var i = 0;i < res.data.length;i++){
          bnNewArry.push(res.data[i].banner)
        }
        that.setData({
          outlist: res.data,
          bannerimg: res.data[that.data.current].banner,
          bannerArr: bnNewArry,
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
  onReady: function () {
    // console.log(this.data.outlist);
  },
  reqdetail: function (e) {
    var cate = e.currentTarget.id;
    wx.navigateTo({
      url: '../detail/detail?vid=' + cate
    });

    utils.setStorage(cate);
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