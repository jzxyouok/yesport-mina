const utils = require('../../utils/utils');

Page({
  data: {
    scrollTop: 0,
    curvideo: '',
    curtitle: '',
    curUrl: '',
    cursummary: '',
    curPro: '',
    ramDataArr: '',
    listAlbum: '',
    listRecom: '',
    loadst: 'loading'
  },
  onShareAppMessage: function () {
    return {
      title: this.data.curtitle,
      path: this.data.curUrl
    }
  },
  scroll: function(e) {
    // console.log(e)
  },
  onLoad:function(options){
      console.log(options);
      var vid = options.vid || "001";
      var that = this;

      wx.request({
        url: 'https://dev.yechtv.com/api/',
        data: {
          type: 'detail',
          time: new Date().getTime()
        },
        method: 'GET', 
        success: function(res){
          var curdata = res.data[vid];
          var newDataArr = [];

          for(var d in res.data){
            newDataArr.push(res.data[d]);
          }
          //数组打乱随机
          newDataArr.sort(function(){
            return 0.5 - Math.random();
          });

          that.setData({
            ramDataArr: newDataArr,
            listAlbum: curdata,
            curvideo: curdata[0].source,
            curtitle: curdata[0].title,
            curUrl: '/page/detail/detail?vid='+curdata[0].title,
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
            title: '请求数据错误~'
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

    for(var i = 0; i < listAlbum.length;i++){
      if(vid === listAlbum[i].vid){
        this.setData({
          curvideo: listAlbum[i].source,
          curtitle: listAlbum[i].title,
          curUrl: '/page/detail/detail?vid='+listAlbum[i].title,
          cursummary: listAlbum[i].content,
          curPro: listAlbum[i].production
        })
      }
    }

    utils.setStorage(vid);
  },
  getAlbum: function(e){
    var cate = utils.getCate(e.currentTarget.id);
    utils.setStorage(cate);
    wx.redirectTo({
      url: '../detail/detail?vid=' + cate
    })
  }
})