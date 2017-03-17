const utils = require('../../utils/utils');
const conf = require('../../utils/conf');
var app = getApp();

Page({
  data: {
    storage: 0,
    newHisList: '',
    likeList: '',
    dload: 'loading',
    likeload: 'loading'
  },
  onLoad: function () {
    var that = this;
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      // console.log(userInfo);//用户信息
      that.setData({
        userInfo: userInfo
      });
    });
  },
  onShow: function(){
    var that = this;

    function getLocalHis(array){
      var storArray = array.reverse();//按时间倒序排列记录
      var albumListData = wx.getStorageSync('albumListData') || [];
      var arr = [];

      for(var i = 0;i < storArray.length;i++){
        var curVid = storArray[i].vid;
        var o = {};

        for(var j = 0;j < albumListData.length;j++){
          
          for(var k = 0;k < albumListData[j]['data'].length;k++){
            if(albumListData[j]['data'][k].vid === curVid){
              o.vid = albumListData[j]['data'][k].vid;
              o.imgurl = albumListData[j]['data'][k].imgurl;
              o.title = albumListData[j]['data'][k].title;
              o.time = utils.timeFormat(storArray[i].time);
              arr.push(o);
            }
          }

        }
      }
      return utils.unique(arr);
    };

    //找到记录历史记录的列表数组
    wx.getStorage({
      key: 'historyStor',
      success: function(res){
        var arr = getLocalHis(res['data']);
        
        that.setData({
          newHisList: arr,
          dload: 'normal'
        });

      },
      fail: function(){
        that.setData({
          dload: 'noresult'
        })
      }
    });

    //找到收藏列表的本地存储
    wx.getStorage({
      key: 'likelist',
      success: function(res){
        var arr = getLocalHis(res['data']);

        that.setData({
          likeList: arr,
          likeload: 'normal'
        });
      },
      fail: function() {
        that.setData({
          likeload: 'noresult'
        });
      }
    });
  },
  onHide: function(){
    //用户离开当前页面的时候存储已授权公开信息
    var userInfo = this.data.userInfo;

    wx.request({
      url: conf.apiURL,
      data: {
        'type': 'adduser',
        'data': userInfo
      },
      method: 'POST',
      success: function(res){
        console.log(res['data']);
      }
    })
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
            storage: 0,
            likeload: 'noresult',
            dload: 'noresult'
          })
        }
      }
    })
  },
  getdetail: function(e){
    var vid = e.currentTarget.id;

    wx.navigateTo({
      url: '../detail/detail?vid=' + vid
    });
  }
})