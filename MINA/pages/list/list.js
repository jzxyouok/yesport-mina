const utils = require('../../utils/utils');

Page({
  data:{
    cateTitle: '夜动体育',
    dataArr: ''
  },
  onLoad:function(options){
    var vid = options.vid || '2016002001',
        cateID = utils.getCate(vid), that = this;

    //先从storage拿到api数据，设置数据
    wx.getStorage({
      key: 'reqApiData',
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
    });

  },
  onPullDownRefresh: function(){
    wx.stopPullDownRefresh()
  }
})