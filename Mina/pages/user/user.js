const utils = require('../../utils/utils');
var app = getApp();

Page({
  data: {
    userInfo: {},
    storage: 0,
    reqApiData: '',
    newHisList: '',
    dload: 'loading'
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
  onShow: function(){
    var that = this;
    //先从storage拿到api数据，设置数据
    this.setData({
      reqApiData: wx.getStorageSync('reqApiData')
    });
    
    //找到记录历史记录的列表数组
    wx.getStorage({
      key: 'historyStor',
      success: function(res){
        var storArray = res.data.reverse();//按时间倒序排列记录
        var apiData = that.data.reqApiData;
        var a = [];

        for(var i = 0;i < storArray.length;i++){
          var curVid = storArray[i].vid;
          var cateID = utils.getCate(curVid);
          var o = {};

          for(var j = 0;j < apiData[cateID].length;j++){

            if(apiData[cateID][j].vid === curVid){
              o.vid = apiData[cateID][j].vid;
              o.imgurl = apiData[cateID][j].imgurl;
              o.title = apiData[cateID][j].title;
              o.time = utils.timeFormat(storArray[i].time);
              a.push(o);
            }
          }
        }

        that.setData({
          newHisList: a,
          dload: 'normal'
        });

      },
      fail: function(){
        that.setData({
          dload: 'noresult'
        })
      }
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