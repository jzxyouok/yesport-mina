const utils = require('../../utils/utils');
const conf = require('../../utils/conf');

Page({
  onLoad:function(options){
    var that = this;
    wx.request({
      url: conf.apiURL+'/album/get',
      method: 'GET',
      success: function(res){
        for(var i = 0;i < res['data'].length;i++){
          res['data'][i].playcount = Math.random() * 1000 >> 0;
        }
        that.setData({
          albumlist: res['data']
        });
      },
      fail: function() {
        // fail
      }
    })
  },
  reqdetail: function(d){
      var cid = d.currentTarget.dataset.cid;
      wx.navigateTo({
          url: '../detail/detail?cid=' + cid
      });
  },
  
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  }
})