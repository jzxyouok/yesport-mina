const utils = require('../../utils/utils');

Page({
  data:{
    cateTitle: '夜动体育',
    dataArr: ''
  },
  onLoad:function(options){
    var vid = options.vid || '2016001001',
        cateID = utils.getCate(vid), that = this;

    wx.request({
      url: 'https://dev.yechtv.com/api/',
      data: {
        type: 'detail',
        time: new Date().getTime()
      },
      method: 'GET',
      success: function(res){
        var data = res.data[cateID];
        that.setData({
          cateTitle: data[0]['title'],
          dataArr: data
        });
      },
      fail: function() {
        wx.showToast({
          title: '加载失败~',
          icon: 'loading'
        })
      }
    })
  },
  onPullDownRefresh: function(){
    wx.stopPullDownRefresh()
  }
})