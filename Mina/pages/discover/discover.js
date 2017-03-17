const utils = require('../../utils/utils');
const conf = require('../../utils/conf');
var app = getApp();

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
    });
  },
  reqdetail: function(d){
      var cid = d.currentTarget.dataset.cid;
      wx.navigateTo({
          url: '../detail/detail?cid=' + cid
      });
  },
  onUnload:function(){
      var openid = app.globalData.userInfo.openid;
      utils.upRemoteData(openid, function(res){
        console.log(res);
      });
  }
})