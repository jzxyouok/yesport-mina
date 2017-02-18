const utils = require('../../utils/utils');

Page({
  data: {
    vid: '',
    scrollTop: 0,
    curvideo: '',
    curtitle: '',
    curUrl: '',
    cursummary: '',
    curPro: '',
    ramDataArr: '',
    listAlbum: '',
    listRecom: '',
    iconlike: 'd',
    loadst: 'loading'
  },
  onShareAppMessage: function () {
    return {
      title: this.data.curtitle,
      path: this.data.curUrl
    }
  },
  onLoad:function(options){

    // if(!options.vid){
    //   wx.showToast({
    //     title: '请求数据错误~',
    //     icon: 'loading'
    //   });
    //   return;
    // }
      var vid = options.vid || '2016001001';//默认vid用做调试数据接口
      var catID = utils.getCate(vid);
      var that = this;

      wx.request({
        url: 'https://dev.yechtv.com/api/',
        data: {
          type: 'detail',
          time: new Date().getTime()
        },
        method: 'GET', 
        success: function(res){
          var curdata = res.data[catID];
          var newDataArr = [];

          for(var d in res.data){
            newDataArr.push(res.data[d]);
          }
          //数组打乱随机
          newDataArr.sort(function(){
            return 0.5 - Math.random();
          });

          that.setData({
            vid: curdata[0].vid,
            ramDataArr: newDataArr,
            listAlbum: curdata,
            curvideo: curdata[0].source,
            curtitle: curdata[0].title,
            curUrl: '/page/detail/detail?vid='+curdata[0].vid,
            cursummary: curdata[0].content,
            curPro: curdata[0].production,
            loadst: "normal"
          });

          wx.setNavigationBarTitle({
            title: curdata[0].title
          });

          //存储一份数据给观看历史记录用，不用再次拉新数据
          wx.setStorage({
            key: 'reqApiData',
            data: res.data
          });
          
        },
        fail: function() {
          wx.showToast({
            title: '请求数据错误~',
            icon: 'loading'
          });
          this.setData({
            loadst: fail
          })
        }
      })
  },
  getdetail: function(e){
    var vid = e.currentTarget.id;
    var listAlbum = this.data.listAlbum;
    this.setData({
      vid: vid
    });

    for(var i = 0; i < listAlbum.length;i++){
      if(vid === listAlbum[i].vid){
        this.setData({
          curvideo: listAlbum[i].source,
          curtitle: listAlbum[i].title,
          curUrl: '/page/detail/detail?vid='+listAlbum[i].vid,
          cursummary: listAlbum[i].content,
          curPro: listAlbum[i].production
        })
      }
    }

    utils.setStorage(vid);
  },
  getAlbum: function(e){
    var vid = e.currentTarget.id;

    wx.redirectTo({
      url: '../detail/detail?vid=' + vid
    })
  },
  likeit: function(e){
    // wx.removeStorageSync('likelist') //调试清理本地缓存
    // this.data.iconlike === "d" ? this.setData({iconlike: 'cur'}) : this.setData({iconlike: 'd'});

    var vid = this.data.vid;
    if(wx.getStorageSync('likelist')){
      var likelist = wx.getStorageSync('likelist');

      if(typeof(likelist) === 'string'){
        //只有一个vid的时候是string
        likelist = wx.getStorageSync('likelist').split(',');
      }else{
        //两个或以上vid的时候返回object
        likelist = wx.getStorageSync('likelist');
      }

      function checkLike(vid){
        for(var i = 0;i < likelist.length;i++){
          if(likelist[i] === vid){
            return 'liked';
          }
        }
      };

      if('liked' !== checkLike(vid)){
        likelist.push(vid);
        wx.setStorageSync('likelist', likelist);
      }


    }else{
      wx.setStorageSync('likelist', vid);
    }
    this.setData({iconlike: 'cur'});
    wx.showToast({
      title: '收藏成功',
    });
  }
})