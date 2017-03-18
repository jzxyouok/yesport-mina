const utils = require('../../utils/utils');

Page({
  data:{
    cateTitle: '夜动体育',
    dataArr: ''
  },
  onLoad:function(options){
    var cid = options.cid,
        that = this;

    //先从storage拿到api数据，设置数据
    wx.getStorage({
      key: 'albumListData',
      success: function(res){
        var data = res.data;
        for(var i = 0;i < data.length;i++){
          if(data[i].cid === cid){
             that.setData({
                cateTitle: data[i].data[0]['cname'],
                dataArr: data[i].data
              });
          }
        }
      },
      fail: function() {
        wx.showToast({
          title: '加载失败~',
          icon: 'loading'
        })
      }
    });

  }
})