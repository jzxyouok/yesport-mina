const utils = require('../../utils/utils');

Page({
  data: {
    autoplay: false,
    vid: '',
    scrollTop: 0,
    curvideo: '',
    curtitle: '',
    // curUrl: '',
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
      path: '/pages/detail/detail?vid='+this.data.vid
    }
  },
  onLoad:function(options){

      var vid = options.vid || '2016001001';//默认vid用做调试数据接口
      var cateID = utils.getCate(vid);
      var that = this;

      wx.request({
        url: 'https://dev.yechtv.com/api/',
        data: {
          type: 'detail',
          time: new Date().getTime()
        },
        method: 'GET', 
        success: function(res){

          var curdata = res.data[cateID];
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
            // curUrl: '/page/detail/detail?vid='+curdata[0].vid,
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
          });
        }
      });

      //检查有没有收藏过
      utils.reqLikeSt("likelist", vid, function(){
        that.setData({
          iconlike: 'cur'
        });
      });

      wx.getNetworkType({
        success: function(res) {
          // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
          var networkType = res.networkType

          if(networkType === 'wifi'){
            //如果检测到WIFI网络环境自动播放，并写入storage计算播放过
            that.setData({
              autoplay: !that.data.autoplay
            });

            //记录到hisStorage观看记录
            utils.setStorage(vid);

          }
        }
      });
      
  },
  onShow: function(){
    var that = this, vid = this.data.vid;
  },
  getdetail: function(e){
    var vid = e.currentTarget.id,
        listAlbum = this.data.listAlbum,
        that = this;

    that.setData({
      vid: vid,
      iconlike: 'd'
    });

    for(var i = 0; i < listAlbum.length;i++){
      if(vid === listAlbum[i].vid){
        this.setData({
          curvideo: listAlbum[i].source,
          curtitle: listAlbum[i].title,
          // curUrl: '/page/detail/detail?vid='+listAlbum[i].vid,
          cursummary: listAlbum[i].content,
          curPro: listAlbum[i].production
        })
      }
    };

    //检查有没有收藏过
    utils.reqLikeSt("likelist", vid, function(){
      that.setData({
        iconlike: 'cur'
      });
    });

    wx.getNetworkType({
      success: function(res) {
        // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
        var networkType = res.networkType

        if(networkType === 'wifi'){
          //如果检测到WIFI网络环境自动播放，并写入storage计算播放过
          that.setData({
            autoplay: true
          });

          //记录到hisStorage观看记录
          utils.setStorage(vid);

        }
      }
    });
  },
  getAlbum: function(e){
    var vid = e.currentTarget.id;

    wx.redirectTo({
      url: '../detail/detail?vid=' + vid
    });

  },
  likeit: function(e){
    // wx.removeStorageSync('likelist');return; //调试清理本地缓存
    // this.data.iconlike === "d" ? this.setData({iconlike: 'cur'}) : this.setData({iconlike: 'd'});

    if(this.data.iconlike === 'cur'){
      wx.showToast({
        title: '已经收藏过了',
        icon: 'loading',
        mask: true
      });
      return;
    }

    var vid = this.data.vid,
        time = new Date().getTime(),
        arr = [],
        obj = {};
    if(wx.getStorageSync('likelist')){
      var likelist = wx.getStorageSync('likelist');

      if('liked' !== utils.likeStatus(vid, likelist)){
        obj.vid = vid;
        obj.time = time;
        likelist.push(obj);
        wx.setStorageSync('likelist', likelist);
      }

    }else{
      obj.vid = vid;
      obj.time = time;
      arr.push(obj)
      wx.setStorageSync('likelist', arr);
    }
    this.setData({iconlike: 'cur'});
    wx.showToast({
      title: '收藏成功',
    });
  },
  mlike: function(e){
    var vid = e.currentTarget.id;
    var that = this;
    //TODO：数据绑定的方式做模板列表渲染
  },
  bindplay: function(e){
    var vid = this.data.vid;
    //记录到hisStorage观看记录，点击播放触发
    utils.setStorage(vid);
  }
})