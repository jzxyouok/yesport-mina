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
    var that = this,
        historyLen = wx.getStorageSync('historyStor') ? wx.getStorageSync('historyStor').length : 0,
        collectLen = wx.getStorageSync('likelist') ? wx.getStorageSync('likelist').length : 0;

    wx.request({
      url: conf.apiURL,
      data: {
        type: 'checkpross',
        historyLen: historyLen,
        collectLen: collectLen,
        openid: app.globalData.userInfo.openid
      },
      method: 'POST',
      success: function(res){
        if(res['data'].hisModify === 'true' && res['data'].historyData){
          //观看记录服务器的数据比较新
          var arr = utils.getLocalHis(res['data'].historyData);

          that.setData({
            newHisList: arr,
            dload: 'normal'
          });

          //重新存储到本地
          wx.setStorageSync('historyStor', res['data'].historyData);
        }else{
          //找到记录历史记录的列表数组
          wx.getStorage({
            key: 'historyStor',
            success: function(hisres){
              var arr = utils.getLocalHis(hisres['data']);
              
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
        }
        
        if(res['data'].collModify === 'true' && res['data'].collectData){
          //收藏记录服务器的数据比较新
          var arr = utils.getLocalHis(res['data'].collectData);

          that.setData({
            likeList: arr,
            likeload: 'normal'
          });

          //重新存储到本地
          wx.setStorageSync('likelist', res['data'].collectData);
        }else{
          //找到收藏列表的本地存储
          wx.getStorage({
            key: 'likelist',
            success: function(likeres){
              var arr = utils.getLocalHis(likeres['data']);

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
        }
      },
      fail: function(err) {
        console.log(err);
      }
    });        

    //查看本地缓存数据size
    wx.getStorageInfo({
      success: function(res) {
        that.setData({
          storage: res.currentSize
        })
      }
    });
  },
  onReady: function () {
    //
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
    var vid = e.currentTarget.dataset.vid;

    wx.navigateTo({
      url: '../detail/detail?vid=' + vid
    });
  }
})