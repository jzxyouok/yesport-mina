const utils = require('../../utils/utils');
const conf = require('../../utils/conf');
var app = getApp();

Page({
  onLoad:function(options){
    var that = this;
    wx.request({
      url: conf.apiURL+'/album/get',
      data: {
        t: new Date().getTime()
      },
      method: 'GET',
      success: function(res){
        var data = res['data'];
        for(var i = 0;i < data.length;i++){
          data[i].playcount = utils.numconvert(data[i].playcount);
        }
        that.setData({
          albumlist: data
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